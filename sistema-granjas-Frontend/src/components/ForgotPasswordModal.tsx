import { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../api/auth";

interface Props {
  onClose: () => void;
}

type Step = "email" | "code" | "newPassword";

export default function ForgotPasswordModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Código enviado. Revisa tu correo electrónico.");
      setStep("code");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar el código";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...code];
    updated[index] = value;
    setCode(updated);
    if (value && index < 4) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (pasted.length === 5) {
      setCode(pasted.split(""));
      codeRefs.current[4]?.focus();
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 5) {
      toast.error("Ingresa los 5 dígitos del código");
      return;
    }
    setLoading(true);
    try {
      await verifyResetCode(email, fullCode);
      toast.success("Código verificado correctamente.");
      setStep("newPassword");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código incorrecto";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code.join(""), newPassword, confirmPassword);
      toast.success("¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al restablecer la contraseña";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await forgotPassword(email);
      setCode(["", "", "", "", ""]);
      toast.success("Nuevo código enviado. Revisa tu correo.");
      codeRefs.current[0]?.focus();
    } catch {
      toast.error("No se pudo reenviar el código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition text-xl leading-none"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Header */}
        <div className="bg-green-700 rounded-t-2xl px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🔑</span>
            <h2 className="text-xl font-bold">Recuperar contraseña</h2>
          </div>
          <p className="text-green-100 text-sm">
            {step === "email" && "Ingresa tu correo institucional"}
            {step === "code" && "Ingresa el código que enviamos a tu correo"}
            {step === "newPassword" && "Crea tu nueva contraseña"}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 px-8 pt-4">
          {(["email", "code", "newPassword"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step === s
                  ? "bg-green-700"
                  : ["email", "code", "newPassword"].indexOf(step) > i
                  ? "bg-green-400"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="px-8 pb-8 pt-6">
          {/* ── PASO 1: Email ── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <p className="text-sm text-gray-600">
                Te enviaremos un código de <strong>5 dígitos</strong> al correo registrado para que puedas restablecer tu contraseña.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu.correo@ucaldas.edu.co"
                  className="w-full rounded-lg border border-gray-300 py-2.5 px-3.5 text-sm focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-700 py-2.5 font-medium text-white hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando código..." : "Enviar código"}
              </button>
            </form>
          )}

          {/* ── PASO 2: Código ── */}
          {step === "code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <p className="text-sm text-gray-600">
                Enviamos un código a <strong>{email}</strong>. Ingrésalo a continuación.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Código de verificación
                </label>
                <div className="flex justify-center gap-3">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      onPaste={i === 0 ? handleCodePaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl border-gray-300 focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition"
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || code.join("").length !== 5}
                className="w-full rounded-lg bg-green-700 py-2.5 font-medium text-white hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verificando..." : "Verificar código"}
              </button>
              <p className="text-center text-sm text-gray-500">
                ¿No recibiste el código?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-green-700 font-semibold hover:underline disabled:opacity-50"
                >
                  Reenviar
                </button>
              </p>
              <p className="text-center text-xs text-gray-400">
                El código expira en 10 minutos
              </p>
            </form>
          )}

          {/* ── PASO 3: Nueva contraseña ── */}
          {step === "newPassword" && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <p className="text-sm text-gray-600">
                Crea una nueva contraseña segura para tu cuenta. Debe tener al menos 6 caracteres, una letra y un número.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3.5 pr-10 text-sm focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showNew ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Repite la contraseña"
                    className="w-full rounded-lg border border-gray-300 py-2.5 px-3.5 pr-10 text-sm focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full rounded-lg bg-green-700 py-2.5 font-medium text-white hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
