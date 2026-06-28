// src/components/LoginForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginAPI } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import GoogleLoginButton from "./GoogleLoginButtom";
import ForgotPasswordModal from "./ForgotPasswordModal";
import toast from "react-hot-toast";

interface Props {
  onSwitch: () => void;
}

export default function LoginForm({ onSwitch }: Props) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginAPI(email, password);
      login(data.access_token);
      toast.success(`Bienvenido, ${data.nombre || 'Usuario'}!`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showForgot && (
        <ForgotPasswordModal onClose={() => setShowForgot(false)} />
      )}

      <form onSubmit={handleLogin} className="space-y-5 animate-fadeIn">
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-green-700 focus:ring-green-700"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block font-medium text-gray-700">
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-green-700 hover:underline font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-green-700 focus:ring-green-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-700 py-2 font-medium text-white hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Ingresando..." : "Iniciar Sesión"}
        </button>

        {/* Google Login - SOLO para usuarios registrados */}
        <div className="mt-4">
          <p className="text-center text-gray-600 mb-2">o inicia sesión con</p>
          <GoogleLoginButton />
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          ¿No tienes cuenta?{" "}
          <span
            onClick={onSwitch}
            className="cursor-pointer text-green-700 font-semibold hover:underline"
          >
            Regístrate aquí (solo formulario)
          </span>
        </p>
      </form>
    </>
  );
}