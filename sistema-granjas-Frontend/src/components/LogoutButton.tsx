/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

interface Props {
    className?: string;
    variant?: "default" | "minimal" | "icon-only";
}

export default function LogoutButton({ className = "", variant = "default" }: Props) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (!confirm("¿Estás seguro de que quieres cerrar sesión?")) {
            return;
        }

        setLoading(true);
        try {
            // Intentar hacer logout en el servidor
            await logout();
        } catch (error: any) {
            // Si hay error, solo registrarlo, pero continuar con el logout local
            console.error("Error en logout del servidor:", error);
        } finally {
            // Siempre limpiar el estado local y redirigir
            // Incluso si no hay token o falla la llamada al servidor
            
            // Limpiar cualquier dato de autenticación local
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            // También limpiar cualquier otro dato de sesión que tengas
            
            setLoading(false);
            alert("Sesión cerrada correctamente");
            
            // Redirigir al login y recargar para resetear el estado de la app
            navigate("/login");
            // Pequeño delay para asegurar que la navegación ocurra antes del reload
            setTimeout(() => {
                navigate(0);
            }, 100);
        }
    };

    if (variant === "minimal") {
        return (
            <button
                onClick={handleLogout}
                disabled={loading}
                className={`flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors ${className}`}
            >
                <i className="fas fa-sign-out-alt mr-2"></i>
                {loading ? "Cerrando..." : "Cerrar Sesión"}
            </button>
        );
    }

    if (variant === "icon-only") {
        return (
            <button
                onClick={handleLogout}
                disabled={loading}
                className={`p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${className}`}
                title="Cerrar sesión"
            >
                {loading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                ) : (
                    <i className="fas fa-sign-out-alt"></i>
                )}
            </button>
        );
    }

    // Variante default - estilo que coincide con tus otros botones
    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={`
                flex items-center justify-center
                bg-red-600 hover:bg-red-700 
                text-white font-medium
                px-4 py-2.5 
                rounded-lg 
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:shadow-md
                ${className}
            `}
        >
            {loading ? (
                <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Cerrando...
                </>
            ) : (
                <>
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Cerrar Sesión
                </>
            )}
        </button>
    );
}