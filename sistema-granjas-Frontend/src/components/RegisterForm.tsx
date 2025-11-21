/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { register, saveToken } from "../api/auth";
import RoleSelector from "./RoleSelector";
import type { Role } from "../types/auth";

interface Props {
    roles: Role[];
    onSwitch: () => void;
}

export default function RegisterForm({ roles, onSwitch }: Props) {
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones del frontend
        if (password !== confirm) {
            alert("Las contraseñas no coinciden");
            return;
        }
        if (!selectedRole) {
            alert("Selecciona un rol");
            return;
        }
        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        if (password.length > 50) { // Más conservador
            alert("La contraseña no puede tener más de 50 caracteres");
            return;
        }

        setLoading(true);
        try {
            const fullName = `${nombre} ${apellido}`;
            const data = await register(fullName, email, password, selectedRole);
            saveToken(data.access_token);
            alert("Registro exitoso, ahora puedes iniciar sesión");
            onSwitch();
        } catch (err: any) {
            alert(err.message || "Error al registrar usuario");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-5">
            <div>
                <label className="block font-medium text-gray-700 mb-2">
                    Tipo de Usuario
                </label>
                <RoleSelector
                    roles={roles}
                    selectedRole={selectedRole}
                    onSelect={setSelectedRole}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="Nombres"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-green-700 focus:ring-green-700"
                />
                <input
                    type="text"
                    placeholder="Apellidos"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-green-700 focus:ring-green-700"
                />
            </div>

            <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-green-700 focus:ring-green-700"
            />

            <div className="grid grid-cols-2 gap-3">
                <input
                    type="password"
                    placeholder="Contraseña (mín. 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={100}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-green-700 focus:ring-green-700"
                />
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