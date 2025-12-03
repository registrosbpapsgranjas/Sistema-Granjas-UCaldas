// components/ModulesCard.tsx
import React from 'react';

interface ModulesCardProps {
    title: string;
    description: string;
    icon: string;
    color: string;
    count?: number | null;
    onClick: () => void;
}

const ModulesCard: React.FC<ModulesCardProps> = ({
    title,
    description,
    icon,
    color,
    count,
    onClick
}) => {
    return (
        <div
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={onClick}
        >
            {/* Header con color */}
            <div className={`${color} h-2 w-full`}></div>

            <div className="p-6">
                {/* Icono y título */}
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
                        <i className={`${icon} text-white text-xl`}></i>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                            {count !== null && count !== undefined && (
                                <span className="bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">
                                    {count}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Descripción */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                    {description}
                </p>

                {/* Botón Acceder */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Evita que el click se propague al contenedor
                        onClick();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                    Acceder
                    <i className="fas fa-arrow-right ml-2 text-sm"></i>
                </button>
            </div>
        </div>
    );
};

export default ModulesCard;