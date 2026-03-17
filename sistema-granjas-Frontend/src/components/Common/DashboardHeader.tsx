import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LogoutButton from '../LogoutButton';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardHeaderProps {
    title?: string;
    selectedModule?: string | null;
    onBack?: () => void;
}

interface ModuleInfo {
    name: string;
    path: string;
    icon: string;
    description: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title = "Sistema Granjas",
    selectedModule,
    onBack
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Guardar usuario en localStorage cuando cambia
    useEffect(() => {
        if (user?.nombre) {
            localStorage.setItem("user", user.nombre);
        }
    }, [user]);

    // Actualizar hora cada minuto
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Definir qué módulos puede ver cada rol (con iconos y descripciones)
    const getModulesByRole = (rol: string | undefined): ModuleInfo[] => {
        if (!rol) return [];

        const modulesByRole: Record<string, ModuleInfo[]> = {
            admin: [
                { name: 'Granjas', path: '/gestion/granjas', icon: 'fa-warehouse', description: 'Administrar granjas' },
                { name: 'Programas', path: '/gestion/programas', icon: 'fa-clipboard-list', description: 'Gestionar programas' },
                { name: 'Lotes', path: '/gestion/lotes', icon: 'fa-tractor', description: 'Control de lotes' },
                { name: 'Cultivos', path: '/gestion/cultivos', icon: 'fa-leaf', description: 'Cultivos y especies' },
                { name: 'Usuarios', path: '/gestion/usuarios', icon: 'fa-users', description: 'Gestión de usuarios' },
                { name: 'Inventario', path: '/gestion/inventario', icon: 'fa-boxes', description: 'Control de inventario' },
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Diagnósticos agrícolas' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Recomendaciones' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Planificación de labores' }
            ],
            asesor: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Crear diagnósticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Ver recomendaciones' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Seguir labores' }
            ],
            docente: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Evaluar diagnósticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Aprobar recomendaciones' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Supervisar labores' }
            ],
            talento_humano: [
                { name: 'Usuarios', path: '/gestion/usuarios', icon: 'fa-users', description: 'Gestionar personal' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Asignar labores' }
            ],
            estudiante: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Realizar diagnósticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Recibir recomendaciones' }
            ],
            trabajador: [
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Ver mis labores' }
            ]
        };

        return modulesByRole[rol] || [];
    };

    // Obtener icono por rol
    const getRoleIcon = (rol: string | undefined): string => {
        if (!rol) return 'fa-user';

        const roleIcons: Record<string, string> = {
            admin: 'fa-crown',
            asesor: 'fa-chart-line',
            docente: 'fa-chalkboard-teacher',
            talento_humano: 'fa-user-tie',
            estudiante: 'fa-user-graduate',
            trabajador: 'fa-hard-hat'
        };

        return roleIcons[rol] || 'fa-user';
    };

    // Obtener color por rol
    const getRoleColor = (rol: string | undefined): string => {
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

    // Obtener mensaje de bienvenida según la hora
    const getGreeting = (): string => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const userModules = user ? getModulesByRole(user.rol) : [];
    const roleIcon = getRoleIcon(user?.rol);
    const roleColor = getRoleColor(user?.rol);
    const greeting = getGreeting();

    // Verificar si una ruta está activa
    const isActive = (path: string): boolean => {
        return location.pathname === path;
    };

    return (
        <header className="bg-white shadow-lg sticky top-0 z-50 border-b">
            {/* Primera fila: Logo y usuario */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Logo */}
                    <div 
                        className="flex items-center space-x-4 cursor-pointer group" 
                        onClick={() => navigate('/dashboard')}
                    >
                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white text-green-700 transition-transform group-hover:scale-105">
                            <img
                                src="/icons/icon-512.png"
                                alt="Sistema de granjas"
                                className="h-14 w-14 sm:h-18 sm:w-18"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-green-700">Sistema Granjas</h1>
                            <p className="text-gray-500 text-xs sm:text-sm">Gestión Agrícola y Pecuario</p>
                        </div>
                    </div>

                    {/* Información de usuario */}
                    {user ? (
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="hidden sm:block text-right">
                                <div className="text-sm text-gray-500">{greeting},</div>
                                <div className="font-semibold text-gray-800">
                                    {user.nombre}
                                </div>
                                <div className="text-xs text-gray-500 capitalize flex items-center justify-end">
                                    <span className={`w-2 h-2 rounded-full ${roleColor.replace('bg-', 'bg-').replace('600', '400')} mr-1`}></span>
                                    {user.rol?.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${roleColor} rounded-full flex items-center justify-center shadow-md`}>
                                    <i className={`fas ${roleIcon} text-white text-lg sm:text-xl`}></i>
                                </div>
                                <LogoutButton
                                    variant="minimal"
                                    className="px-2 sm:px-4 py-2 text-sm"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <a
                                href="/login"
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Iniciar Sesión
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Navegación por roles */}
            {user && !selectedModule && userModules.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="relative">
                            {/* Indicador de scroll (opcional) */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none sm:hidden"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none sm:hidden"></div>
                            
                            {/* Menú horizontal con scroll en móvil */}
                            <nav className="flex overflow-x-auto py-2 sm:py-3 space-x-1 sm:space-x-2 scrollbar-hide">
                                {userModules.map((module) => {
                                    const active = isActive(module.path);
                                    return (
                                        <a
                                            key={module.path}
                                            href={module.path}
                                            className={`
                                                group relative flex items-center px-3 py-2 rounded-lg
                                                transition-all duration-200 whitespace-nowrap
                                                ${active 
                                                    ? 'bg-green-100 text-green-700 font-medium' 
                                                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                                                }
                                            `}
                                            title={module.description}
                                        >
                                            <i className={`fas ${module.icon} mr-2 text-sm ${
                                                active ? 'text-green-600' : 'text-gray-500 group-hover:text-green-500'
                                            }`}></i>
                                            <span>{module.name}</span>
                                            
                                            {/* Tooltip para móvil (opcional) */}
                                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block whitespace-nowrap">
                                                {module.description}
                                            </span>
                                        </a>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Título del módulo seleccionado */}
            {selectedModule && (
                <div className="border-t border-gray-200 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                {onBack && (
                                    <button
                                        onClick={onBack}
                                        className="flex items-center p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white transition-all duration-200"
                                        title="Volver"
                                    >
                                        <i className="fas fa-arrow-left mr-2"></i>
                                        <span className="hidden sm:inline">Volver</span>
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{title}</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 capitalize flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${roleColor} mr-2`}></span>
                                        Módulo: {selectedModule}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Acciones rápidas del módulo (opcional) */}
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-white transition-all"
                                    title="Actualizar"
                                >
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-white transition-all"
                                    title="Ir al dashboard"
                                >
                                    <i className="fas fa-home"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default DashboardHeader;