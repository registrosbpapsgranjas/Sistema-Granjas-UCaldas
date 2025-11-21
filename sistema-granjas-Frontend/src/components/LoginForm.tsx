// src/components/LoginForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveToken } from "../api/auth";
import GoogleLoginButton from "./GoogleLoginButtom";

interface Props {
  onSwitch: () => void;
}

export default function LoginForm({ onSwitch }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      saveToken(data.access_token);
      alert(`Bienvenido, ${data.nombre}`);
      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <label className="block font-medium text-gray-700 mb-2">
          Contraseña
        </label>
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
        className="w-full rounded-lg bg-green-700 py-2 font-medium text-white hover:bg-green-800 transition"
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
          className="cursor-pointer text-green-700 font-semibold"
        >
          Regístrate aquí (solo formulario)
        </span>
      </p>
    </form>
  );
}