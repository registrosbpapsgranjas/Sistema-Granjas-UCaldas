import React from "react";
import { useNavigate } from "react-router-dom";
import type { Programa, Granja } from "../../types/granjaTypes";

interface ProgramasListProps {
    programas: Programa[];
    onEditar: (programa: Programa) => void;
    onEliminar: (id: number) => void;
    onVerDetalles: (programa: Programa) => void;
    obtenerLabelTipo: (tipo: string) => string;
    obtenerIconoTipo: (tipo: string) => string;
}

const ProgramasTable: React.FC<ProgramasListProps> = ({
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

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case "agricola":
                return "bg-green-100 text-green-800 border-green-200";
            case "pecuario":
                return "bg-amber-100 text-amber-800 border-amber-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getEstadoColor = (activo: boolean) => {
        return activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    };

    const renderGranjas = (granjas?: Granja[]) => {
        if (!granjas || granjas.length === 0) {
            return (
                <span className="text-gray-400 text-sm italic">
                    Sin granjas asignadas
                </span>
            );
        }

        const granjasVisibles = granjas.slice(0, 3);
        const restantes = granjas.length - 3;

        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {granjasVisibles.map((granja) => (
                    <span
                        key={granja.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                        <i className="fas fa-warehouse mr-1 text-xs"></i>
                        {granja.nombre}
                    </span>
                ))}
                {restantes > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        +{restantes} más
                    </span>
                )}
            </div>
        );
    };

    if (programas.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <i className="fas fa-clipboard-list text-gray-300 text-5xl mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No hay programas registrados
                </h3>
                <p className="text-gray-500 mb-6">Comienza creando un nuevo programa.</p>
                <button
                    onClick={() => onEditar({} as Programa)} // Esto debería abrir el modal de creación
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Crear programa
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {programas.map((programa) => (
                <div
                    key={programa.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => onVerDetalles(programa)}
                >
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${getTipoColor(programa.tipo)} flex items-center justify-center`}>
                                    <i className={`${obtenerIconoTipo(programa.tipo)} text-xl`}></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">
                                        {programa.nombre}
                                    </h3>
                                    {programa.descripcion && (
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {programa.descripcion}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTipoColor(programa.tipo)}`}>
                                    <i className={`${obtenerIconoTipo(programa.tipo)} mr-1 text-xs`}></i>
                                    {obtenerLabelTipo(programa.tipo)}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(programa.activo)}`}>
                                    <i className="fas fa-circle mr-1 text-xs"></i>
                                    {programa.activo ? "Activo" : "Inactivo"}
                                </span>
                            </div>

                            {/* Granjas asignadas */}
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <i className="fas fa-warehouse text-blue-500 mr-2"></i>
                                    Granjas asignadas
                                </h4>
                                {renderGranjas(programa.granjas)}
                            </div>
                        </div>

                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                            {/* Ver Lotes */}
                            <button
                                onClick={(e) => verLotesPrograma(e, programa.id)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                                title="Ver lotes del programa"
                            >
                                <i className="fas fa-seedling text-xl"></i>
                            </button>
                            {/* Ver Cultivos */}
                            <button
                                onClick={(e) => verCultivosPrograma(e, programa.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                title="Ver cultivos asociados"
                            >
                                <i className="fas fa-leaf text-xl"></i>
                            </button>
                            {/* Editar */}
                            <button
                                onClick={() => onEditar(programa)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                                title="Editar programa"
                            >
                                <i className="fas fa-edit text-xl"></i>
                            </button>
                            {/* Eliminar */}
                            <button
                                onClick={() => onEliminar(programa.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Eliminar programa"
                            >
                                <i className="fas fa-trash text-xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProgramasTable;