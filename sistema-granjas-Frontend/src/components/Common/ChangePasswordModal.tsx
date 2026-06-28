import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { api } from '../../services/api';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{
        current_password?: string;
        new_password?: string;
        confirm_password?: string;
        general?: string;
    }>({});

    const clearErrors = () => setErrors({});

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!currentPassword) {
            newErrors.current_password = 'La contraseña actual es requerida';
        }
        if (!newPassword) {
            newErrors.new_password = 'La nueva contraseña es requerida';
        } else if (newPassword.length < 6) {
            newErrors.new_password = 'La nueva contraseña debe tener al menos 6 caracteres';
        } else if (newPassword.length > 100) {
            newErrors.new_password = 'La nueva contraseña no puede tener más de 100 caracteres';
        } else if (!/[a-zA-Z]/.test(newPassword)) {
            newErrors.new_password = 'La nueva contraseña debe contener al menos una letra';
        }
        if (!confirmPassword) {
            newErrors.confirm_password = 'Confirma tu nueva contraseña';
        } else if (newPassword && confirmPassword !== newPassword) {
            newErrors.confirm_password = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        if (!validate()) return;

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });

            toast.success('Contraseña actualizada exitosamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Error al cambiar la contraseña';
            if (typeof errorMessage === 'string') {
                setErrors({ general: errorMessage });
            } else if (Array.isArray(errorMessage)) {
                const fieldErrors: typeof errors = {};
                errorMessage.forEach((e: any) => {
                    const field = e.loc?.[1];
                    if (field === 'current_password') fieldErrors.current_password = e.msg;
                    else if (field === 'new_password') fieldErrors.new_password = e.msg;
                    else if (field === 'confirm_password') fieldErrors.confirm_password = e.msg;
                    else fieldErrors.general = e.msg;
                });
                setErrors(fieldErrors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-md">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">
                        <i className="fas fa-key"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Cambiar Contraseña</h2>
                        <p className="text-sm text-gray-500">Actualiza tu contraseña de acceso</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña actual *
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                if (errors.current_password) {
                                    setErrors(prev => ({ ...prev, current_password: undefined }));
                                }
                            }}
                            className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 ${
                                errors.current_password
                                    ? 'border-red-500 focus:ring-red-400'
                                    : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder="Ingresa tu contraseña actual"
                            disabled={loading}
                        />
                        {errors.current_password && (
                            <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nueva contraseña *
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (errors.new_password) {
                                    setErrors(prev => ({ ...prev, new_password: undefined }));
                                }
                                if (errors.confirm_password) {
                                    setErrors(prev => ({ ...prev, confirm_password: undefined }));
                                }
                            }}
                            className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 ${
                                errors.new_password
                                    ? 'border-red-500 focus:ring-red-400'
                                    : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder="Nueva contraseña (mín. 6 caracteres)"
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            <i className="fas fa-info-circle mr-1"></i>
                            Mínimo 6 caracteres, debe contener al menos una letra
                        </p>
                        {errors.new_password && (
                            <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar nueva contraseña *
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirm_password) {
                                    setErrors(prev => ({ ...prev, confirm_password: undefined }));
                                }
                            }}
                            className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 ${
                                errors.confirm_password
                                    ? 'border-red-500 focus:ring-red-400'
                                    : 'border-gray-300 focus:ring-green-500'
                            }`}
                            placeholder="Confirma tu nueva contraseña"
                            disabled={loading}
                        />
                        {errors.confirm_password && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Cambiar Contraseña
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ChangePasswordModal;