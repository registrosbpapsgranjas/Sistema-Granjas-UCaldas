// src/components/Programas/ProgramasTable.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import type { Programa, Granja } from "../../types/granjaTypes";

interface ProgramasTableProps {
    programas: Programa[];
    onEditar: (programa: Programa) => void;
    onEliminar: (id: number) => void;
    onVerDetalles: (programa: Programa) => void;
    obtenerLabelTipo: (tipo: string) => string;
    obtenerIconoTipo: (tipo: string) => string;
}

const ProgramasTable: React.FC<ProgramasTableProps> = ({
    programas,
    onEditar,
    onEliminar,
    onVerDetalles,
    obtenerLabelTipo,
    obtenerIconoTipo,
}) => {
    const navigate = useNavigate();

    const verLotesPrograma = (e: React.MouseEvent, programaId: number) => {
        e.stopPropagation();
        navigate(`/programas/${programaId}/lotes`);
    };

    const verCultivosPrograma = (e: React.MouseEvent, programaId: number) => {
        e.stopPropagation();
        navigate(`/gestion/cultivos?programaId=${programaId}`);
    };

    // Renderizado de granjas asignadas (similar a la versión anterior)
    const renderGranjas = (granjas?: Granja[]) => {
        if (!granjas || granjas.length === 0) {
            return (
                <span className="text-gray-400 text-sm italic">
                    Sin granjas asignadas
                </span>
            );
        }

        const granjasVisibles = granjas.slice(0, 2);
        const restantes = granjas.length - 2;

        return (
            <div className="flex flex-wrap gap-1">
                {granjasVisibles.map((granja) => (
                    <span
                        key={granja.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                        <i className="fas fa-warehouse mr-1 text-xs"></i>
                        {granja.nombre}
                    </span>
                ))}
                {restantes > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        +{restantes} más
                    </span>
                )}
            </div>
        );
    };

    const getEstadoColor = (activo: boolean) => {
        return activo
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    };

    const getTipoBadgeColor = (tipo: string) => {
        switch (tipo) {
            case "agricola":
                return "bg-green-50 text-green-700 border-green-200";
            case "pecuario":
                return "bg-amber-50 text-amber-700 border-amber-200";
            default:
                return "bg-gray-50 text-gray-600 border-gray-200";
        }
    };

    if (programas.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden text-center py-12">
                <i className="fas fa-clipboard-list text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">No hay programas registrados</p>
                <p className="text-sm text-gray-400 mt-2">
                    Comienza creando un nuevo programa
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Granjas Asignadas
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {programas.map((programa) => (
                            <tr
                                key={programa.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onVerDetalles(programa)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {programa.nombre}
                                    </div>
                                    {programa.descripcion && (
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                            {programa.descripcion}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getTipoBadgeColor(programa.tipo)}`}>
                                        <i className={`${obtenerIconoTipo(programa.tipo)} mr-1 text-xs`}></i>
                                        {obtenerLabelTipo(programa.tipo)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {renderGranjas(programa.granjas)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(programa.activo)}`}>
                                        {programa.activo ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div
                                        className="flex justify-end space-x-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Ver Lotes */}
                                        <button
                                            onClick={(e) => verLotesPrograma(e, programa.id)}
                                            className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded transition-colors"
                                            title="Ver lotes del programa"
                                        >
                                            <i className="fas fa-seedling"></i>
                                        </button>

                                        {/* Ver Cultivos */}
                                        <button
                                            onClick={(e) => verCultivosPrograma(e, programa.id)}
                                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                                            title="Ver cultivos asociados"
                                        >
                                            <i className="fas fa-leaf"></i>
                                        </button>

                                        {/* Editar */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditar(programa);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                                            title="Editar programa"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>

                                        {/* Eliminar */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEliminar(programa.id);
                                            }}
                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Eliminar programa"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProgramasTable;