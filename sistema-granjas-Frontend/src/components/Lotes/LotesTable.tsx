import React from 'react';

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
    // Función para obtener color según estado
    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'inactivo': return 'bg-gray-100 text-gray-800';
            case 'completado': return 'bg-blue-100 text-blue-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Formatear fecha
    const formatearFecha = (fechaString: string) => {
        try {
            const fecha = new Date(fechaString);
            return fecha.toLocaleDateString('es-ES');
        } catch {
            return '-';
        }
    };

    // Calcular fecha de fin
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
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Lista de Lotes</h3>
                        <p className="text-sm text-gray-500">
                            Mostrando {lotes.length} lotes registrados
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Granja
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cultivo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Inicio / Fin
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duración
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Gestión
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lotes.map((lote) => (
                            <tr key={lote.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {lote.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{lote.nombre}</p>
                                        {lote.tipo_lote_nombre && (
                                            <p className="text-xs text-gray-500">{lote.tipo_lote_nombre}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {lote.granja_nombre || `Granja ${lote.granja_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm text-gray-900">{lote.nombre_cultivo}</p>
                                        {lote.cultivo_nombre && (
                                            <p className="text-xs text-gray-500">{lote.cultivo_nombre}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(lote.estado)}`}>
                                        {lote.estado || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>
                                        <p>Inicio: {formatearFecha(lote.fecha_inicio)}</p>
                                        <p className="text-xs">Fin: {calcularFechaFin(lote.fecha_inicio, lote.duracion_dias)}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {lote.duracion_dias} días
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {lote.tipo_gestion}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onEditar(lote)}
                                            className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                            title="Editar"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => onEliminar(lote.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                            title="Eliminar"
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
                        <i className="fas fa-seedling text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">No hay lotes registrados</p>
                        <p className="text-sm">Crea tu primer lote usando el botón "Nuevo Lote"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LotesTable;