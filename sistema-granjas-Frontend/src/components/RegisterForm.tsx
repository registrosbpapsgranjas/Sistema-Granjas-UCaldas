/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { register, saveToken } from "../api/auth";
import RoleSelector from "./RoleSelector";
import type { Role } from "../types/auth";

interface Props {
    roles: Role[];
    onSwitch: () => void;
}

// Tipo para errores por campo (mapeo de nombres de campo a mensajes)
type FieldErrors = {
    nombre?: string;
    email?: string;
    password?: string;
    role_id?: string;
    general?: string;
};

export default function RegisterForm({ roles, onSwitch }: Props) {
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Limpiar error de un campo cuando el usuario empieza a escribir
    const clearFieldError = (field: keyof FieldErrors) => {
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({}); // limpiar errores anteriores

        // --- Validaciones del frontend ---
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
        // Validación extra: al menos una letra (coincide con la regla del backend)
        if (!/[a-zA-Z]/.test(password)) {
            setFieldErrors({ password: "La contraseña debe contener al menos una letra" });
            return;
        }

        setLoading(true);
        try {
            const fullName = `${nombre} ${apellido}`.trim();
            const data = await register(fullName, email, password, selectedRole);
            saveToken(data.access_token);
            alert("Registro exitoso, ahora puedes iniciar sesión");
            onSwitch();
        } catch (err: any) {
            // Procesar errores estructurados del backend (422 Validation Error)
            if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
                const backendErrors: FieldErrors = {};
                err.response.data.detail.forEach((error: any) => {
                    // El campo suele venir en error.loc: ["body", "nombre"]
                    const field = error.loc?.[1]; // tomamos el segundo elemento
                    if (field === "nombre") {
                        backendErrors.nombre = error.msg;
                    } else if (field === "email") {
                        backendErrors.email = error.msg;
                    } else if (field === "password") {
                        backendErrors.password = error.msg;
                    } else if (field === "role_id") {
                        backendErrors.role_id = error.msg;
                    } else {
                        // Si no reconocemos el campo, lo ponemos como general
                        backendErrors.general = error.msg;
                    }
                });
                setFieldErrors(backendErrors);
            } else {
                // Error genérico (ej. 500, timeout)
                setFieldErrors({
                    general: err.message || "Error al registrar usuario. Inténtalo de nuevo.",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-5">
            {/* Mensaje de error general */}
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
                    roles={roles}
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
                        onChange={(e) => {
                            setNombre(e.target.value);
                            clearFieldError("nombre");
                        }}
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
                        onChange={(e) => {
                            setApellido(e.target.value);
                            clearFieldError("nombre"); // el error de nombre afecta al nombre completo
                        }}
                        required
                        className={`w-full rounded-lg border py-2 px-3 focus:ring-green-700 ${
                            fieldErrors.nombre
                                ? "border-red-500 focus:border-red-500"
                                : "border-gray-300 focus:border-green-700"
                        }`}
                    />
                </div>
                {/* Mostrar error del campo "nombre" (nombre completo) debajo de ambos inputs */}
                {fieldErrors.nombre && (
                    <div className="col-span-2">
                        <p className="text-sm text-red-600">{fieldErrors.nombre}</p>
                    </div>
                )}
            </div>

            <div>
                <input
                    type="email"
                    placeholder="Correo electrónico"
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