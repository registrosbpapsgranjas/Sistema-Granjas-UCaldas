// src/components/GoogleLoginButton.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle, saveToken } from "../api/auth";

export default function GoogleLoginButton() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse: any) => {
        try {
            setLoading(true);
            const idToken = credentialResponse.credential;

            if (!idToken) {
                alert("No se recibió token de Google.");
                return;
            }

            const data = await loginWithGoogle(idToken);
            saveToken(data.access_token);
            alert(`✅ Bienvenido, ${data.nombre}`);
            navigate("/dashboard");
        } catch (err: any) {
            console.error("Error Google OAuth:", err);

            if (err.message?.includes("no registrado")) {
                alert("❌ Usuario no registrado. Regístrate primero con el formulario tradicional.");
            } else {
                alert(err.message || "Error al iniciar sesión con Google");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleError = () => {
        alert("❌ Error al conectar con Google.");
    };

    return (
        <div className="w-full flex justify-center">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap={false}
            />
        </div>
    );
}
