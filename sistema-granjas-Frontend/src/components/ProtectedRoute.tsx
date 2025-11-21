// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Props {
    children: React.ReactNode;
    requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Cargando...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.rol !== requiredRole) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-600 text-lg">
                    No tienes permisos para acceder a esta página
                </div>
            </div>
        );
    }

    return <>{children}</>;
}