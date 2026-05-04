import React from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';

interface DiagnosticosTableProps {
    diagnosticos: DiagnosticoItem[];
    onEditar: (diagnostico: DiagnosticoItem) => void;
    onEliminar: (id: number) => void;
    onAsignarDocente?: (diagnostico: DiagnosticoItem) => void;
    onAgregarEvidencia: (diagnostico: DiagnosticoItem) => void;
    onVerDetalles: (diagnostico: DiagnosticoItem) => void;
    onCerrar?: (diagnostico: DiagnosticoItem) => void;
    onCrearRecomendacion?: (diagnostico: DiagnosticoItem) => void;
    currentUser: any;
}

const DiagnosticosTable: React.FC<DiagnosticosTableProps> = ({
    diagnosticos,
    onEditar,
    onEliminar,
    onAsignarDocente,
    onAgregarEvidencia,
    onVerDetalles,
    onCerrar,
    onCrearRecomendacion,
    currentUser
}) => {

    const getEstadoBadge = (estado?: string) => {
        if (!estado) {
            return (
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                    Sin estado
                </span>
            );
        }

        const estados: Record<string, string> = {
            abierto: 'bg-green-100 text-green-800',
            en_revision: 'bg-yellow-100 text-yellow-800',
            cerrado: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs ${estados[estado] || 'bg-gray-100'}`}>
                {estado}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Programa</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Monitoreo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Lote</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Usuario</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {diagnosticos.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    No hay diagnósticos
                                </td>
                            </tr>
                        ) : (
                            diagnosticos.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    {/* Tipo */}
                                    <td className="px-4 py-3 text-sm">
                                        {d.tipo_diagnostico?.replace(/_/g, ' ')}
                                    </td>

                                    {/* Programa */}
                                    <td className="px-4 py-3 text-sm">
                                        {d.programa_nombre || 'N/A'}
                                    </td>

                                    {/* Monitoreo */}
                                    <td className="px-4 py-3 text-sm">
                                        {d.tipo_monitoreo_nombre || 'N/A'}
                                    </td>

                                    {/* Lote */}
                                    <td className="px-4 py-3 text-sm">
                                        <div>{d.lote_nombre || `Lote ${d.lote_id}`}</div>
                                        <div className="text-xs text-gray-500">
                                            {d.granja_nombre}
                                        </div>
                                    </td>

                                    {/* Usuario */}
                                    <td className="px-4 py-3 text-sm">
                                        {d.usuario_nombre || 'N/A'}
                                    </td>

                                    {/* Fecha */}
                                    <td className="px-4 py-3 text-sm">
                                        {new Date(d.fecha_creacion).toLocaleDateString()}
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex gap-2 flex-wrap">

                                            <button
                                                onClick={() => onVerDetalles(d)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Ver detalles"
                                            >
                                                👁
                                            </button>

                                            <button
                                                onClick={() => onEditar(d)}
                                                className="text-yellow-600 hover:text-yellow-800"
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>

                                            <button
                                                onClick={() => onEliminar(d.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Eliminar"
                                            >
                                                🗑
                                            </button>

                                            {onCrearRecomendacion && (
                                                <button
                                                    onClick={() => onCrearRecomendacion(d)}
                                                    className="text-green-600 hover:text-green-800 text-xs font-semibold border border-green-300 rounded px-2 py-0.5 bg-green-50 hover:bg-green-100"
                                                    title="Crear recomendación desde este diagnóstico"
                                                >
                                                    + Rec.
                                                </button>
                                            )}

                                        </div>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DiagnosticosTable;