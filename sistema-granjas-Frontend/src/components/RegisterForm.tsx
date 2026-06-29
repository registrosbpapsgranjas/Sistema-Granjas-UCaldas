/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { sendVerificationEmail, verifyRegistrationCode, saveToken } from "../api/auth";
import RoleSelector from "./RoleSelector";
import type { Role } from "../types/auth";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Props {
    roles: Role[];
    onSwitch: () => void;
}

type Step = "form" | "code";

type FieldErrors = {
    nombre?: string;
    email?: string;
    password?: string;
    role_id?: string;
    general?: string;
};

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-'.]+$/;
const UCLADAS_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@ucaldas\.edu\.co$/i;

const ROLES_PERMITIDOS_REGISTRO = ["estudiante", "docente", "talento_humano", "trabajador"];

export default function RegisterForm({ roles, onSwitch }: Props) {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState<Step>("form");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [code, setCode] = useState(["", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);
    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startResendTimer = () => {
        setResendTimer(60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const rolesFiltrados = roles.filter(rol =>
        ROLES_PERMITIDOS_REGISTRO.includes(rol.nombre.toLowerCase())
    );

    const clearFieldError = (field: keyof FieldErrors) => {
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const value = e.target.value;
        setter(value);
        if (fieldErrors.nombre) {
            setFieldErrors((prev) => ({ ...prev, nombre: undefined }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const fullName = `${nombre} ${apellido}`.trim();

        if (!fullName) {
            setFieldErrors({ nombre: "El nombre es obligatorio" });
            return;
        }
        if (!NAME_REGEX.test(fullName)) {
            setFieldErrors({ nombre: "El nombre solo puede contener letras, espacios, guiones, apóstrofes y puntos." });
            return;
        }
        if (!UCLADAS_EMAIL_REGEX.test(email)) {
            setFieldErrors({ email: "Solo se permiten correos institucionales @ucaldas.edu.co" });
            return;
        }
        if (password !== confirm) {
            setFieldErrors({ general: "Las contraseñas no coinciden" });
            return;
        }
        if (!selectedRole) {
            setFieldErrors({ role_id: "Selecciona un rol" });
            return;
        }
        if (password.length < 6) {
            setFieldErrors({ password: "La contraseña debe tener al menos 6 caracteres" });
            return;
        }
        if (password.length > 100) {
            setFieldErrors({ password: "La contraseña no puede tener más de 100 caracteres" });
            return;
        }
        if (!/[a-zA-Z]/.test(password)) {
            setFieldErrors({ password: "La contraseña debe contener al menos una letra" });
            return;
        }
        if (!/[0-9]/.test(password)) {
            setFieldErrors({ password: "La contraseña debe contener al menos un número" });
            return;
        }

        setLoading(true);
        try {
            await sendVerificationEmail(fullName, email, password, selectedRole);
            toast.success("Código enviado. Revisa tu correo institucional.");
            setCode(["", "", "", "", ""]);
            setStep("code");
            startResendTimer();
            setTimeout(() => codeRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            const msg = err.message || "Error al enviar el código de verificación.";
            setFieldErrors({ general: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleCodeInput = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const updated = [...code];
        updated[index] = value;
        setCode(updated);
        if (value && index < 4) {
            codeRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            codeRefs.current[index - 1]?.focus();
        }
    };

    const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
        if (pasted.length === 5) {
            setCode(pasted.split(""));
            codeRefs.current[4]?.focus();
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = code.join("");
        if (fullCode.length !== 5) {
            toast.error("Ingresa los 5 dígitos del código");
            return;
        }
        setLoading(true);
        try {
            const data = await verifyRegistrationCode(email, fullCode);
            saveToken(data.access_token);
            login(data.access_token);
            toast.success("¡Cuenta creada exitosamente! Bienvenido/a.");
            navigate("/dashboard");
        } catch (err: any) {
            const msg = err.message || "Código incorrecto o expirado";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const fullName = `${nombre} ${apellido}`.trim();
            await sendVerificationEmail(fullName, email, password, selectedRole!);
            setCode(["", "", "", "", ""]);
            toast.success("Nuevo código enviado. Revisa tu correo.");
            startResendTimer();
            codeRefs.current[0]?.focus();
        } catch (err: any) {
            toast.error(err.message || "No se pudo reenviar el código");
        } finally {
            setLoading(false);
        }
    };

    if (rolesFiltrados.length === 0) {
        return (
            <div className="space-y-5">
                <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-200">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    No hay roles disponibles para registro. Contacta al administrador.
                </div>
                <button
                    onClick={onSwitch}
                    className="w-full rounded-lg bg-gray-200 py-2 font-medium text-gray-700 hover:bg-gray-300 transition"
                >
                    Volver al inicio de sesión
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Progress bar */}
            <div className="flex gap-1">
                {(["form", "code"] as Step[]).map((s, i) => (
                    <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            step === s
                                ? "bg-green-700"
                                : ["form", "code"].indexOf(step) > i
                                ? "bg-green-400"
                                : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>

            {/* ── PASO 1: Formulario ── */}
            {step === "form" && (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                    {fieldErrors.general && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                            {fieldErrors.general}
                        </div>
                    )}

                    <div>
                        <label className="block font-medium text-gray-700 mb-2">
                            Tipo de Usuario
                        </label>
                        <RoleSelector
                            roles={rolesFiltrados}
                            selectedRole={selectedRole}
                            onSelect={setSelectedRole}
                        />
                        {fieldErrors.role_id && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.role_id}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <input
                                type="text"
                                placeholder="Nombres"
                                value={nombre}
                                onChange={(e) => handleNombreChange(e, setNombre)}
                                required
                                className={`w-full rounded-lg border py-2 px-3 focus:ring-green-700 ${
                                    fieldErrors.nombre
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-gray-300 focus:border-green-700"
                                }`}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Apellidos"
                                value={apellido}
                                onChange={(e) => handleNombreChange(e, setApellido)}
                                required
                                className={`w-full rounded-lg border py-2 px-3 focus:ring-green-700 ${
                                    fieldErrors.nombre
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-gray-300 focus:border-green-700"
                                }`}
                            />
                        </div>
                        {fieldErrors.nombre && (
                            <div className="col-span-2">
                                <p className="text-sm text-red-600">{fieldErrors.nombre}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="Correo electrónico (@ucaldas.edu.co)"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                clearFieldError("email");
                            }}
                            required
                            className={`w-full rounded-lg border py-2 px-3 focus:ring-green-700 ${
                                fieldErrors.email
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:border-green-700"
                            }`}
                        />
                        {fieldErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <input
                                type="password"
                                placeholder="Contraseña (mín. 6 caracteres)"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    clearFieldError("password");
                                }}
                                required
                                minLength={6}
                                maxLength={100}
                                className={`w-full rounded-lg border py-2 px-3 focus:ring-green-700 ${
                                    fieldErrors.password
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-gray-300 focus:border-green-700"
                                }`}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Confirmar Contraseña"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                                minLength={6}
                                maxLength={100}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-green-700 focus:ring-green-700"
                            />
                        </div>
                        {fieldErrors.password && (
                            <div className="col-span-2">
                                <p className="text-sm text-red-600">{fieldErrors.password}</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-green-700 py-2 font-medium text-white hover:bg-green-800 transition disabled:opacity-50"
                    >
                        {loading ? "Enviando código..." : "Verificar correo y continuar"}
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        ¿Ya tienes cuenta?{" "}
                        <span
                            onClick={onSwitch}
                            className="cursor-pointer text-green-700 font-semibold"
                        >
                            Inicia sesión aquí
                        </span>
                    </p>
                </form>
            )}

            {/* ── PASO 2: Verificación de código ── */}
            {step === "code" && (
                <form onSubmit={handleCodeSubmit} className="space-y-5">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                        Enviamos un código de verificación a <strong>{email}</strong>. Ingrésalo a continuación para crear tu cuenta.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                            Código de verificación
                        </label>
                        <div className="flex justify-center gap-3">
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { codeRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeInput(i, e.target.value)}
                                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                                    onPaste={i === 0 ? handleCodePaste : undefined}
                                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl border-gray-300 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition"
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.join("").length !== 5}
                        className="w-full rounded-lg bg-green-700 py-2.5 font-medium text-white hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creando cuenta..." : "Crear cuenta"}
                    </button>

                    <div className="text-center space-y-1">
                        <p className="text-sm text-gray-500">
                            ¿No recibiste el código?{" "}
                            {resendTimer > 0 ? (
                                <span className="text-gray-400 font-medium">
                                    Reenviar en{" "}
                                    <span className="text-green-700 font-bold tabular-nums">
                                        {resendTimer}s
                                    </span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={loading}
                                    className="text-green-700 font-semibold hover:underline disabled:opacity-50"
                                >
                                    Reenviar
                                </button>
                            )}
                        </p>
                        {resendTimer > 0 && (
                            <div className="mx-auto w-40 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-600 rounded-full transition-all duration-1000"
                                    style={{ width: `${(resendTimer / 60) * 100}%` }}
                                />
                            </div>
                        )}
                        <p className="text-xs text-gray-400">
                            El código expira en 10 minutos
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep("form")}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
                    >
                        ← Volver al formulario
                    </button>
                </form>
            )}
        </div>
    );
}
