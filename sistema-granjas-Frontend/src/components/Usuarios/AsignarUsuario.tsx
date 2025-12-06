// src/components/AsignarUsuarioModal.tsx (versión mejorada)
import Modal from "../Common/Modal";

interface AsignarUsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    usuarios: any[];
    usuariosAsignados: any[]; // Cambié el nombre para ser más genérico
    usuarioSeleccionado: number;
    setUsuarioSeleccionado: (id: number) => void;
    onAsignar: () => void;
    titulo?: string; // Prop opcional para personalizar el título
}

export const AsignarUsuarioModal: React.FC<AsignarUsuarioModalProps> = ({
    isOpen,
    onClose,
    usuarios,
    usuariosAsignados,
    usuarioSeleccionado,
    setUsuarioSeleccionado,
    onAsignar,
    titulo = "Asignar Usuario" // Valor por defecto
}) => {
    // Filtrar usuarios que no están asignados
    const usuariosDisponibles = usuarios.filter(
        usuario => !usuariosAsignados.some(asignado => asignado.id === usuario.id)
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">{titulo}</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Usuario
                    </label>
                    <select
                        value={usuarioSeleccionado}
                        onChange={(e) => setUsuarioSeleccionado(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={0}>-- Seleccione un usuario --</option>
                        {usuariosDisponibles.map((usuario: any) => (
                            <option key={usuario.id} value={usuario.id}>
                                {usuario.nombre} - {usuario.email} ({usuario.rol})
                            </option>
                        ))}
                    </select>
                </div>

                {usuariosDisponibles.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-yellow-800 text-sm">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            Todos los usuarios ya están asignados.
                        </p>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onAsignar}
                        disabled={!usuarioSeleccionado || usuariosDisponibles.length === 0}
                        className={`px-4 py-2 rounded-md transition ${!usuarioSeleccionado || usuariosDisponibles.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        Asignar
                    </button>
                </div>
            </div>
        </Modal>
    );
};