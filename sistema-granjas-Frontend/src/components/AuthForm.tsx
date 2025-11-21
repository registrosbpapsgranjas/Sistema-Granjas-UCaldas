import { useState, useEffect } from "react";
import { getRolesDisponibles } from "../api/auth";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import type { Role } from "../types/auth";

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);

    useEffect(() => {
        getRolesDisponibles()
            .then((data) => setRoles(data.roles))
            .catch(() => console.error("Error al obtener roles"));
    }, []);

    return (
        <div className="w-full md:w-1/2 p-8 md:p-12">
            {/* Tabs */}
            <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
                <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 rounded-md py-2 font-medium transition ${isLogin ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    Iniciar Sesión
                </button>
                <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 rounded-md py-2 font-medium transition ${!isLogin ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    Registrarse
                </button>
            </div>

            {isLogin ? (
                <LoginForm onSwitch={() => setIsLogin(false)} />
            ) : (
                <RegisterForm roles={roles} onSwitch={() => setIsLogin(true)} />
            )}
        </div>
    );
}
