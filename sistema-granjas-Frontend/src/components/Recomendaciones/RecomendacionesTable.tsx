// src/components/Recomendaciones/RecomendacionesTable.tsx
import React from 'react';
import type { Recomendacion } from '../../types/recomendacionTypes';

interface RecomendacionesTableProps {
    recomendaciones: Recomendacion[];
    onEditar: (recomendacion: Recomendacion) => void;
    onEliminar: (id: number) => void;
    onAprobar: (recomendacion: Recomendacion) => void;
    onVerDetalles: (recomendacion: Recomendacion) => void;
    currentUser: any;
}

const RecomendacionesTable: React.FC<RecomendacionesTableProps> = ({
    recomendaciones,
    onEditar,
    onEliminar,
    onAprobar,
    onVerDetalles,
    currentUser
}) => {
    // Determinar rol
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;
    const esAsesor = currentUser?.rol_id === 3;
    const esTalentoHumano = currentUser?.rol_id === 6;
    const esEstudiante = currentUser?.rol_id === 4;
    
    // Obtener programas del docente desde la relación usuario_programa
    const programasUsuario = currentUser?.programas?.map((p: any) => p.id) || [];

    // Filtrar recomendaciones según rol
    const recomendacionesFiltradas = recomendaciones.filter(rec => {
        if (esAdmin) return true; // Admin ve todo
        
        if (esDocente) {
            // Docente: solo ve recomendaciones que él generó Y que pertenezcan a sus programas
            const esSuRecomendacion = rec.docente_id === currentUser?.id;
            const perteneceASuPrograma = programasUsuario.includes(rec.programa_id);
            return esSuRecomendacion && perteneceASuPrograma;
        }
        
        if (esAsesor) {
            // Asesor: puede ver todas (solo lectura)
            return true;
        }
        
        if (esTalentoHumano) {
            // Talento humano: puede ver todas las recomendaciones para gestionar labores
            return true;
        }
        
        if (esEstudiante) {
            // Estudiante: solo ve recomendaciones asociadas a sus diagnósticos
            // (esto se filtra mejor desde el backend, pero aquí como respaldo)
            return true;
        }
        
        return true;
    });

    // Función para obtener el color del estado
    const getEstadoBadge = (estado: string) => {
        const estados: Record<string, { color: string; icon: string }> = {
            pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: 'fas fa-clock' },
            aprobada: { color: 'bg-green-100 text-green-800', icon: 'fas fa-check-circle' },
            rechazada: { color: 'bg-red-100 text-red-800', icon: 'fas fa-times-circle' },
            en_progreso: { color: 'bg-blue-100 text-blue-800', icon: 'fas fa-spinner' },
            completada: { color: 'bg-purple-100 text-purple-800', icon: 'fas fa-flag-checkered' },
            cancelada: { color: 'bg-gray-100 text-gray-800', icon: 'fas fa-ban' }
        };

        const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', icon: 'fas fa-question-circle' };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <i className={`${config.icon} mr-1`}></i>
                {estado.charAt(0).toUpperCase() + estado.slice(1).replace(/_/g, ' ')}
            </span>
        );
    };

    // Funciones de permisos
    const puedeEditar = (recomendacion: Recomendacion) => {
        if (esAdmin) return true;
        return false;
        if (esDocente && recomendacion.docente_id === currentUser?.id && recomendacion.estado === 'pendiente') return true;
    };

    const puedeAprobar = (recomendacion: Recomendacion) => {
        if (esAdmin && recomendacion.estado === 'pendiente') return true;
        if (esDocente && recomendacion.docente_id === currentUser?.id && recomendacion.estado === 'pendiente') return true;
        return false;
    };

    const puedeEliminar = (recomendacion: Recomendacion) => {
        if (esAdmin) return true;
        return false;
        if (esDocente && recomendacion.docente_id === currentUser?.id && recomendacion.estado === 'pendiente') return true;
    };

    if (recomendacionesFiltradas.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="text-center py-12 text-gray-500">
                    <i className="fas fa-lightbulb text-4xl mb-3 text-gray-300"></i>
                    <p className="text-lg mb-1">No hay recomendaciones disponibles</p>
                    {esDocente && programasUsuario.length === 0 && (
                        <p className="text-sm text-gray-400 mt-2">
                            No tiene programas asignados. Contacte al administrador.
                        </p>
                    )}
                    {esDocente && programasUsuario.length > 0 && (
                        <p className="text-sm text-gray-400 mt-2">
                            No hay recomendaciones en sus programas asignados.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote / Granja</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recomendacionesFiltradas.map((recomendacion) => (
                            <tr key={recomendacion.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div
                                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                        onClick={() => onVerDetalles(recomendacion)}
                                    >
                                        {recomendacion.titulo}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                        {recomendacion.descripcion?.substring(0, 80)}...
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">
                                            {recomendacion.lote_nombre || `Lote ${recomendacion.lote_id}`}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                            {recomendacion.granja_nombre || 'Sin granja'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {recomendacion.docente_nombre || 'Sin asignar'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getEstadoBadge(recomendacion.estado)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(recomendacion.fecha_creacion).toLocaleDateString()}
                                    <div className="text-xs text-gray-500">
                                        {new Date(recomendacion.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onVerDetalles(recomendacion)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="Ver detalles"
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>

                                        {puedeEditar(recomendacion) && (
                                            <button
                                                onClick={() => onEditar(recomendacion)}
                                                className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                                                title="Editar"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        )}

                                        {puedeAprobar(recomendacion) && (
                                            <button
                                                onClick={() => onAprobar(recomendacion)}
                                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                title="Aprobar"
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                        )}

                                        {puedeEliminar(recomendacion) && (
                                            <button
                                                onClick={() => onEliminar(recomendacion.id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                title="Eliminar"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {esDocente && (
                <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                    <span>
                        <i className="fas fa-info-circle mr-1"></i>
                        Mostrando recomendaciones de sus programas asignados:
                        {currentUser?.programas?.map((p: any) => p.nombre).join(', ') || 'Ninguno'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RecomendacionesTable;