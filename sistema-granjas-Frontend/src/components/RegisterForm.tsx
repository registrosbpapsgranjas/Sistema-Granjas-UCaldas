/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { register, saveToken } from "../api/auth";
import RoleSelector from "./RoleSelector";
import type { Role } from "../types/auth";
import toast from "react-hot-toast";

interface Props {
    roles: Role[];
    onSwitch: () => void;
}

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
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const fullName = `${nombre} ${apellido}`.trim();

        if (!fullName) {
            setFieldErrors({ nombre: "El nombre es obligatorio" });
            return;
        }
        if (!NAME_REGEX.test(fullName)) {
            setFieldErrors({
                nombre: "El nombre solo puede contener letras, espacios, guiones, apóstrofes y puntos.",
            });
            return;
        }
        // 👇 VALIDACIÓN DE EMAIL INSTITUCIONAL
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

        setLoading(true);
        try {
            const data = await register(fullName, email, password, selectedRole);
            saveToken(data.access_token);
            toast.success("Registro exitoso. Ya puedes iniciar sesión.");
            onSwitch();
        } catch (err: any) {
            if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
                const backendErrors: FieldErrors = {};
                err.response.data.detail.forEach((error: any) => {
                    const field = error.loc?.[1];
                    if (field === "nombre") {
                        backendErrors.nombre = error.msg;
                    } else if (field === "email") {
                        backendErrors.email = error.msg;
                    } else if (field === "password") {
                        backendErrors.password = error.msg;
                    } else if (field === "role_id") {
                        backendErrors.role_id = error.msg;
                    } else {
                        backendErrors.general = error.msg;
                    }
                });
                setFieldErrors(backendErrors);
            } else {
                setFieldErrors({
                    general: err.message || "Error al registrar usuario. Inténtalo de nuevo.",
                });
            }
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
        <form onSubmit={handleRegister} className="space-y-5">
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
                        placeholder="Contraseña (mín. 6 caracteres, con letra)"
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
                {loading ? "Registrando..." : "Crear Cuenta"}
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
    );
}