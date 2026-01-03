// components/DashboardHeader.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import LogoutButton from '../LogoutButton';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
    title?: string;
    selectedModule?: string | null;
    onBack?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title = "Sistema de granjas",
    selectedModule,
    onBack
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Definir qué módulos puede ver cada rol
    const getModulesByRole = (rol: string | undefined) => {
        if (!rol) return [];

        const modulesByRole: Record<string, Array<{ name: string, path: string }>> = {
            admin: [
                { name: 'Granjas', path: '/gestion/granjas' },
                { name: 'Programas', path: '/gestion/programas' },
                { name: 'Lotes', path: '/gestion/lotes' },
                { name: 'Usuarios', path: '/gestion/usuarios' },
                { name: 'Cultivos', path: '/gestion/cultivos' },
                { name: 'Inventario', path: '/gestion/inventario' },
                { name: 'Diagnósticos', path: '/gestion/diagnosticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones' },
                { name: 'Labores', path: '/gestion/labores' }
            ],
            asesor: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones' },
                { name: 'Labores', path: '/gestion/labores' }
            ],
            docente: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones' },
                { name: 'Labores', path: '/gestion/labores' }
            ],
            talento_humano: [
                { name: 'Usuarios', path: '/gestion/usuarios' },
                { name: 'Labores', path: '/gestion/labores' }
            ],
            estudiante: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones' }
            ],
            trabajador: [
                { name: 'Labores', path: '/gestion/labores' }
            ]
        };

        return modulesByRole[rol] || [];
    };

    // Obtener icono por rol
    const getRoleIcon = (rol: string | undefined) => {
        if (!rol) return 'fas fa-user';

        const roleIcons: Record<string, string> = {
            admin: 'fas fa-crown',
            asesor: 'fas fa-chart-line',
            docente: 'fas fa-chalkboard-teacher',
            talento_humano: 'fas fa-user-tie',
            estudiante: 'fas fa-user-graduate',
            trabajador: 'fas fa-hard-hat'
        };

        return roleIcons[rol] || 'fas fa-user';
    };

    // Obtener color por rol
    const getRoleColor = (rol: string | undefined) => {
        if (!rol) return 'bg-amber-500';

        const roleColors: Record<string, string> = {
            admin: 'bg-purple-600',
            asesor: 'bg-blue-600',
            docente: 'bg-green-600',
            talento_humano: 'bg-red-600',
            estudiante: 'bg-amber-500',
            trabajador: 'bg-orange-500'
        };

        return roleColors[rol] || 'bg-amber-500';
    };

    const userModules = user ? getModulesByRole(user.rol) : [];
    const roleIcon = getRoleIcon(user?.rol);
    const roleColor = getRoleColor(user?.rol);

    return (
        <header className="bg-white shadow-lg sticky top-0 z-50 border-b">
            {/* Primera fila: Logo y usuario */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        <div className="flex h-22 w-22 items-center justify-center rounded-full bg-white text-green-700 text-2xl">
                            <img
                                src="/icons/icon-512.png" // Ruta a tu icono en la carpeta public/icons
                                alt="Sistema de granjas"
                                className="h-22 w-22" // Ajusta el tamaño según necesites
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-green-700">Sistema de granjas</h1>
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
                                    {user.rol?.replace('_', ' ') || 'Usuario'}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-12 h-12 ${roleColor} rounded-full flex items-center justify-center`}>
                                    <i className={`${roleIcon} text-white`}></i>
                                </div>
                                <LogoutButton
                                    variant="minimal"
                                    className="px-4 py-2"
                                />
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

            {/* Navegación por roles (mostrar según el rol del usuario) */}
            {user && !selectedModule && userModules.length > 0 && (
                <div className="bg-gray-50 border-t">
                    <div className="max-w-7xl mx-auto px-6 py-3">
                        <nav className="flex flex-wrap gap-4 justify-center">
                            {/* Enlaces filtrados por rol */}
                            {userModules.map((module) => (
                                <a
                                    key={module.path}
                                    href={module.path}
                                    className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 px-3 py-1 rounded hover:bg-green-50"
                                >
                                    {module.name}
                                </a>
                            ))}
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
                                className="flex items-center p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
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