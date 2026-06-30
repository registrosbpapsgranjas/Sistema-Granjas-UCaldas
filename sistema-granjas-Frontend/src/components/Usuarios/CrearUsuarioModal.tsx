// src/components/Usuarios/CrearUsuarioModal.tsx
import React, { useState } from "react";
import Modal from "../Common/Modal";

interface CrearUsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    roles: { id: number; nombre: string }[];
    onCreate: (datos: {
        nombre: string;
        email: string;
        password: string;
        rol_id: number;
    }) => Promise<void>;
}

export const CrearUsuarioModal: React.FC<CrearUsuarioModalProps> = ({
    isOpen,
    onClose,
    roles,
    onCreate,
}) => {
    const [form, setForm] = useState({
        nombre: "",
        email: "",
        password: "",
        rol_id: roles[0]?.id ?? 0,
    });
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const resetForm = () => {
        setForm({ nombre: "", email: "", password: "", rol_id: roles[0]?.id ?? 0 });
        setMostrarPassword(false);
        setErrorLocal(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        if (form.password.length < 6) {
            setErrorLocal("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (!form.rol_id) {
            setErrorLocal("Selecciona un rol para el usuario.");
            return;
        }

        try {
            setCargando(true);
            await onCreate({
                nombre: form.nombre.trim(),
                email: form.email.trim(),
                password: form.password,
                rol_id: Number(form.rol_id),
            });
            resetForm();
        } catch (err: any) {
            setErrorLocal(err.message || "Error al crear el usuario.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="md">
            <div className="flex items-center mb-5">
                <div className="bg-green-100 p-3 rounded-full mr-3">
                    <i className="fas fa-user-plus text-green-600 text-xl"></i>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Crear Usuario</h3>
                    <p className="text-sm text-gray-500">
                        El usuario podrá iniciar sesión inmediatamente
                    </p>
                </div>
            </div>

            {errorLocal && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-700 text-sm">
                    <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i>
                    <span>{errorLocal}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={100}
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ej. Juan Carlos Pérez"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ej. usuario@ejemplo.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Se admite cualquier dominio de correo.
                    </p>
                </div>

                {/* Contraseña */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={mostrarPassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Mínimo 6 caracteres"
                        />
                        <button
                            type="button"
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                            tabIndex={-1}
                        >
                            <i className={`fas ${mostrarPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres.</p>
                </div>

                {/* Rol */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={form.rol_id}
                        onChange={(e) => setForm({ ...form, rol_id: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                        <option value="">— Selecciona un rol —</option>
                        {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                                {rol.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Info */}
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800 flex items-start gap-2">
                    <i className="fas fa-info-circle mt-0.5 flex-shrink-0 text-green-600"></i>
                    <span>
                        Se enviará un correo al usuario con sus credenciales de acceso.
                        No se requiere verificación; puede iniciar sesión de inmediato.
                    </span>
                </div>

                {/* Botones */}
                <div className="flex gap-2 justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={cargando}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={cargando}
                        className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {cargando ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Creando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-user-plus"></i>
                                Crear Usuario
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
