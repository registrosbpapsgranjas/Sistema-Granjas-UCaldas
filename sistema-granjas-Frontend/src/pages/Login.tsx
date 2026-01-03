import { useEffect, useState } from "react";
import { getRolesDisponibles } from "../api/auth";
import type { Role } from "../types/auth";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);

    useEffect(() => {
        getRolesDisponibles()
            .then((data) => setRoles(data.roles))
            .catch(() => console.error("No se pudieron obtener los roles"));
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 p-4">
            <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-lg">
                {/* Panel izquierdo */}
                <div className="flex w-1/2 flex-col justify-center bg-green-700 p-10 text-white max-md:hidden relative">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-22 w-22 items-center justify-center rounded-full bg-white text-green-700 text-2xl">
                            <img
                                src="/icons/icon-512.png" // Ruta a tu icono en la carpeta public/icons
                                alt="Sistema de granjas"
                                className="h-22 w-22" // Ajusta el tamaño según necesites
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Sistema de granjas</h1>
                            <p className="text-sm opacity-90">Sistema de Gestión Agrícola y Pecuario</p>
                        </div>
                    </div>
                    <h2 className="text-3xl font-semibold mb-4">
                        Optimiza tu producción agrícola
                    </h2>
                    <p className="opacity-90">
                        Accede a herramientas especializadas para la gestión de granjas, monitoreo de cultivos y coordinación de equipos.
                    </p>
                </div>

                {/* Panel derecho */}
                <div className="w-full md:w-1/2 p-8 md:p-12">
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
                        <RegisterForm
                            onSwitch={() => setIsLogin(true)}
                            roles={roles}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
