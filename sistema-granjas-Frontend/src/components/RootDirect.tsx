// src/components/RootRedirect.tsx
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function RootRedirect() {
    const { loading, isAuthenticated } = useAuth();

    // 👀 No hacer nada mientras carga
    if (loading) return null;

    return isAuthenticated
        ? <Navigate to="/dashboard" replace />
        : <Navigate to="/login" replace />;
}
