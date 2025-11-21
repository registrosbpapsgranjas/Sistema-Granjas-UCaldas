/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/auth";

interface Props {
    className?: string;
    variant?: "default" | "minimal";
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
            await logout();
            alert("Sesión cerrada correctamente");
            navigate("/login");
        } catch (error: any) {
            console.error("Error en logout:", error);
            alert("Error al cerrar sesión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    if (variant === "minimal") {
        return (
            <button
                onClick={handleLogout}
                disabled={loading}
                className={`text-red-600 hover:text-red-800 text-sm ${className}`}
            >
                {loading ? "Cerrando..." : "Cerrar Sesión"}
            </button>
        );
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={`w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 ${className}`}
        >
            {loading ? "Cerrando sesión..." : "Cerrar Sesión"}
        </button>
    );
}