import React, { useEffect, useState } from 'react';
import programaService from '../../services/programaService';

interface LotesTableProps {
    lotes: any[];
    onEditar: (lote: any) => void;
    onEliminar: (id: number) => void;
}

const LotesTable: React.FC<LotesTableProps> = ({
    lotes,
    onEditar,
    onEliminar
}) => {

    // Mapa programa_id -> nombre
    const [programasMap, setProgramasMap] = useState<Record<number, string>>({});

    // Obtener programas por cada lote
    useEffect(() => {
        const cargarProgramas = async () => {
            try {
                const idsUnicos = Array.from(
                    new Set(lotes.map(l => l.programa_id).filter(Boolean))
                );

                const respuestas = await Promise.all(
                    idsUnicos.map(id =>
                        programaService
                            .obtenerProgramaPorId(id)
                            .then(res => ({ id, nombre: res.nombre }))
                            .catch(() => ({ id, nombre: 'No encontrado' }))
                    )
                );

                const map: Record<number, string> = {};
                respuestas.forEach(p => {
                    map[p.id] = p.nombre;
                });

                setProgramasMap(map);
            } catch (error) {
                console.error('Error cargando programas', error);
            }
        };

        if (lotes.length > 0) {
            cargarProgramas();
        }
    }, [lotes]);

    // Estado → color
    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'inactivo': return 'bg-gray-100 text-gray-800';
            case 'completado': return 'bg-blue-100 text-blue-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatearFecha = (fechaString: string) => {
        try {
            return new Date(fechaString).toLocaleDateString('es-ES');
        } catch {
            return '-';
        }
    };

    const calcularFechaFin = (fechaInicio: string, duracionDias: number) => {
        try {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fecha.getDate() + duracionDias);
            return fecha.toLocaleDateString('es-ES');
        } catch {
            return '-';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Lista de Lotes</h3>
                <p className="text-sm text-gray-500">
                    Mostrando {lotes.length} lotes registrados
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Granja</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cultivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicio / Fin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gestión</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {lotes.map((lote) => (
                            <tr key={lote.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium">{lote.nombre}</p>
                                    {lote.tipo_lote_nombre && (
                                        <p className="text-xs text-gray-500">{lote.tipo_lote_nombre}</p>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                                    {lote.granja_nombre || `Granja ${lote.granja_id}`}
                                </td>

                                <td className="px-6 py-4">
                                    <p className="text-sm">{lote.nombre_cultivo}</p>
                                    {lote.cultivo_nombre && (
                                        <p className="text-xs text-gray-500">{lote.cultivo_nombre}</p>
                                    )}
                                </td>

                                {/* PROGRAMA */}
                                <td className="px-6 py-4 text-sm">
                                    {programasMap[lote.programa_id] || '—'}
                                </td>

                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(lote.estado)}`}>
                                        {lote.estado || 'N/A'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <p>Inicio: {formatearFecha(lote.fecha_inicio)}</p>
                                    <p className="text-xs">
                                        Fin: {calcularFechaFin(lote.fecha_inicio, lote.duracion_dias)}
                                    </p>
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {lote.duracion_dias} días
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {lote.tipo_gestion}
                                </td>

                                <td className="px-6 py-4 text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onEditar(lote)}
                                            className="text-yellow-600 hover:text-yellow-900"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => onEliminar(lote.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {lotes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No hay lotes registrados</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LotesTable;
