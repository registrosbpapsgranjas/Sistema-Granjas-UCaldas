import React, { useEffect, useState } from 'react';
import programaService from '../../services/programaService';
import cultivoService from '../../services/cultivoService';
import granjaService from '../../services/granjaService'; // Asegúrate de importar

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

    // Mapas
    const [programasMap, setProgramasMap] = useState<Record<number, string>>({});
    const [cultivosMap, setCultivosMap] = useState<Record<number, any>>({});
    const [granjasMap, setGranjasMap] = useState<Record<number, any>>({});
    
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const cargarDatosRelacionados = async () => {
            if (lotes.length === 0) return;
            
            setCargando(true);
            
            try {
                // IDs únicos
                const programasIds = Array.from(new Set(lotes.map(l => l.programa_id).filter(Boolean)));
                const cultivosIds = Array.from(new Set(lotes.map(l => l.cultivo_id).filter(Boolean)));
                const granjasIds = Array.from(new Set(lotes.map(l => l.granja_id).filter(Boolean)));

                // Promesas para programas
                const programasPromises = programasIds.map(async (id) => {
                    try {
                        const res = await programaService.obtenerProgramaPorId(id);
                        return { id, nombre: res.nombre };
                    } catch {
                        return { id, nombre: 'No encontrado' };
                    }
                });

                // Promesas para cultivos
                const cultivosPromises = cultivosIds.map(async (id) => {
                    try {
                        const res = await cultivoService.obtenerCultivoPorId(id);
                        return { 
                            id, 
                            nombre: res.nombre,
                            tipo: res.tipo 
                        };
                    } catch {
                        return { 
                            id, 
                            nombre: 'No encontrado'
                        };
                    }
                });

                // Promesas para granjas
                const granjasPromises = granjasIds.map(async (id) => {
                    try {
                        const res = await granjaService.obtenerGranjaPorId(id);
                        return { id, nombre: res.nombre };
                    } catch {
                        return { id, nombre: 'No encontrada' };
                    }
                });

                // Esperar todas
                const [programasResp, cultivosResp, granjasResp] = await Promise.all([
                    Promise.all(programasPromises),
                    Promise.all(cultivosPromises),
                    Promise.all(granjasPromises)
                ]);

                // Construir mapas
                const progMap: Record<number, string> = {};
                programasResp.forEach(p => progMap[p.id] = p.nombre);

                const cultMap: Record<number, any> = {};
                cultivosResp.forEach(c => cultMap[c.id] = c);

                const granMap: Record<number, any> = {};
                granjasResp.forEach(g => granMap[g.id] = g);

                setProgramasMap(progMap);
                setCultivosMap(cultMap);
                setGranjasMap(granMap);
                
            } catch (error) {
                console.error('Error cargando datos relacionados:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatosRelacionados();
    }, [lotes]);

    // Funciones auxiliares
    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'inactivo': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatearFecha = (fechaString: string | null | undefined) => {
        if (!fechaString) return '-';
        try {
            return new Date(fechaString).toLocaleDateString('es-ES');
        } catch {
            return '-';
        }
    };

    const obtenerTipoGestion = (cultivoId: number | null | undefined) => {
        if (!cultivoId) return '-';
        const cultivo = cultivosMap[cultivoId];
        return cultivo?.tipo || '-';
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Lista de Lotes</h3>
                <p className="text-sm text-gray-500">
                    Mostrando {lotes.length} {lotes.length === 1 ? 'lote registrado' : 'lotes registrados'}
                    {cargando && <span className="ml-2 text-blue-500">(Cargando datos...)</span>}
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Granja</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cultivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siembra</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gestión</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {lotes.map((lote) => {
                            const cultivo = cultivosMap[lote.cultivo_id];
                            const granja = granjasMap[lote.granja_id];
                            return (
                                <tr key={lote.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{lote.nombre}</div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {granja?.nombre || lote.nombre_granja || `Granja ID: ${lote.granja_id}`}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {cultivo?.nombre || lote.nombre_cultivo || '—'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {programasMap[lote.programa_id] || `Programa ID: ${lote.programa_id}`}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(lote.estado)}`}>
                                            {lote.estado ? lote.estado.charAt(0).toUpperCase() + lote.estado.slice(1) : 'N/A'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Inicio: {formatearFecha(lote.fecha_inicio)}</div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {obtenerTipoGestion(lote.cultivo_id)}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => onEditar(lote)}
                                                className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                                title="Editar lote"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => onEliminar(lote.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Eliminar lote"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {lotes.length === 0 && (
                    <div className="text-center py-12">
                        <i className="fas fa-archive text-gray-400 text-5xl mb-4"></i>
                        <p className="text-lg text-gray-500">No hay lotes registrados</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Comienza creando un nuevo lote desde el botón "Nuevo Lote"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LotesTable;