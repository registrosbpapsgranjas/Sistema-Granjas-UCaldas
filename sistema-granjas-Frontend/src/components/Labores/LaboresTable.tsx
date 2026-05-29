// src/components/Labores/LaboresTable.tsx
import React from 'react';
import type { Labor } from '../../types/laboresTypes';

interface LaboresTableProps {
    labores: Labor[];
    onEditar: (labor: Labor) => void;
    onEliminar: (id: number) => void;
    onVerDetalles: (labor: Labor) => void;
    onAsignarRecursos?: (labor: Labor) => void;
    onCompletar?: (labor: Labor) => void;
    currentUser: any;
}

const LaboresTable: React.FC<LaboresTableProps> = ({
    labores,
    onEditar,
    onEliminar,
    onVerDetalles,
    onAsignarRecursos,
    onCompletar,
    currentUser
}) => {
    const rolesPermitidos = [1, 3,  5, 6, 7]; // IDs de roles permitidos para ver información de labores
    // Función para obtener el color del estado
    const getEstadoBadge = (estado: string) => {
        const estados: Record<string, { color: string; icon: string }> = {
            pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: 'fas fa-clock' },
            en_progreso: { color: 'bg-blue-100 text-blue-800', icon: 'fas fa-spinner' },
            completada: { color: 'bg-green-100 text-green-800', icon: 'fas fa-check-circle' },
            cancelada: { color: 'bg-red-100 text-red-800', icon: 'fas fa-times-circle' }
        };

        const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', icon: 'fas fa-question-circle' };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <i className={`${config.icon} mr-1`}></i>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </span>
        );
    };

    // Barra de progreso
    const getProgressBar = (porcentaje: number) => {
        let color = 'bg-red-500';
        if (porcentaje >= 75) color = 'bg-green-500';
        else if (porcentaje >= 50) color = 'bg-yellow-500';
        else if (porcentaje >= 25) color = 'bg-blue-500';

        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`${color} h-2.5 rounded-full`}
                    style={{ width: `${porcentaje}%` }}
                ></div>
            </div>
        );
    };

    // Funciones de permisos
    const puedeEditar = (labor: Labor) => {
        if (rolesPermitidos.includes(currentUser?.rol_id)) return true; // Admin
        if (labor.trabajador_id === currentUser?.id && labor.estado !== 'completada') return true;
        return false;
    };

    const puedeEliminar = (labor: Labor) => {
        if (currentUser?.rol_id === 3) return false;
        if (rolesPermitidos.includes(currentUser?.rol_id)) return true;
        if (labor.trabajador_id === currentUser?.id && labor.estado === 'pendiente') return true;
        return false;
    };

    const puedeCompletar = (labor: Labor) => {
        return (labor.estado === 'en_progreso' || labor.estado === 'pendiente') &&
            ([1, 3, 6].includes(currentUser?.rol_id) || labor.trabajador_id === currentUser?.id);
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Labor / Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trabajador
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lote / Granja
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado / Progreso
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fechas
                            </th>
                            {(currentUser?.rol_id && rolesPermitidos.includes(currentUser?.rol_id)) && (<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {labores.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    <i className="fas fa-tasks text-3xl mb-2 block text-gray-300"></i>
                                    No hay labores registradas
                                </td>
                            </tr>
                        ) : (
                            labores.map((labor) => (
                                <tr key={labor.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div
                                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                            onClick={() => onVerDetalles(labor)}
                                        >
                                            Labor #{labor.id}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {labor.tipo_labor_nombre || labor.tipo_labor}
                                        </div>
                                        {labor.recomendacion_titulo && (
                                            <div className="text-xs text-blue-600 mt-1">
                                                Rec: {labor.recomendacion_titulo}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">
                                                {labor.trabajador_nombre || `ID: ${labor.trabajador_id}`}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {labor.trabajador_email || ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">
                                                {labor.lote_nombre || `Lote ${labor.lote_id}`}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {labor.granja_nombre || 'Sin granja'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            {getEstadoBadge(labor.estado)}
                                            <div className="flex items-center gap-2">
                                                {getProgressBar(labor.avance_porcentaje)}
                                                <span className="text-xs font-medium text-gray-700">
                                                    {labor.avance_porcentaje}%
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>
                                            <div className="font-medium">
                                                {new Date(labor.fecha_asignacion).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Asignación
                                            </div>
                                        </div>
                                        {labor.fecha_finalizacion && (
                                            <div className="mt-1">
                                                <div className="font-medium">
                                                    {new Date(labor.fecha_finalizacion).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Finalización
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    {(currentUser?.rol_id && rolesPermitidos.includes(currentUser?.rol_id)) && (<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => onVerDetalles(labor)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>

                                            {puedeEditar(labor) && (
                                                <button
                                                    onClick={() => onEditar(labor)}
                                                    className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                                                    title="Editar"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            )}

                                            {puedeCompletar(labor) && onCompletar && (
                                                <button
                                                    onClick={() => onCompletar(labor)}
                                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                    title="Completar labor"
                                                >
                                                    <i className="fas fa-check-circle"></i>
                                                </button>
                                            )}

                                            {puedeEliminar(labor) && (
                                                <button
                                                    onClick={() => onEliminar(labor.id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                    title="Eliminar"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>)}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LaboresTable;