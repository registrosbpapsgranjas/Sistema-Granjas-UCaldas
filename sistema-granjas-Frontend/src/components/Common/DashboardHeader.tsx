// components/DashboardHeader.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface DashboardHeaderProps {
    title?: string;
    selectedModule?: string | null;
    onBack?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title = "AgroTech UCaldas",
    selectedModule,
    onBack
}) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            logout();
        }
    };

    return (
        <header className="bg-white shadow-lg sticky top-0 z-50 border-b">
            {/* Primera fila: Logo y usuario */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                            <i className="fas fa-seedling text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-green-700">AgroTech UCaldas</h1>
                            <p className="text-gray-500 text-sm">Sistema de Gestión Agrícola Integral</p>
                        </div>
                    </div>

                    {/* Información de usuario */}
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className="font-semibold text-gray-800">
                                    {user.nombre}
                                </div>
                                <div className="text-sm text-gray-500 capitalize">
                                    {user.rol}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                                    <i className="fas fa-user-graduate text-white"></i>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                                >
                                    <i className="fas fa-sign-out-alt"></i>
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <a
                                href="/login"
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                            >
                                Iniciar Sesión
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Segunda fila: Navegación (solo en dashboard principal) */}
            {!selectedModule && (
                <div className="bg-gray-50 border-t">
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        <nav className="flex space-x-8 justify-center">
                            <a
                                href="/gestion/granjas"
                                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
                            >
                                Gestión de Granjas
                            </a>
                            <a
                                href="/gestion/programas"
                                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
                            >
                                Gestión de Programas
                            </a>
                            <a
                                href="/gestion/labores"
                                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
                            >
                                Gestión de Labores
                            </a>
                            <a
                                href="/gestion/usuarios"
                                className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
                            >
                                Gestión de Usuarios
                            </a>
                        </nav>
                    </div>
                </div>
            )}

            {/* Título del módulo seleccionado */}
            {selectedModule && (
                <div className="max-w-7xl mx-auto px-6 pb-4">
                    <div className="flex items-center space-x-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Volver al Dashboard
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                            <p className="text-sm text-gray-600 capitalize">
                                Módulo: {selectedModule}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default DashboardHeader;