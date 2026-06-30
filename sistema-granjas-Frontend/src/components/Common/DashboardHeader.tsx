import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import LogoutButton from '../LogoutButton';
import { useNavigate, useLocation, Link } from 'react-router-dom';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Guardar usuario en localStorage
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

    // Cerrar menú al cambiar de ruta
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevenir scroll del body cuando el menú está abierto
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    // Definición de módulos por rol (igual que antes)
    const getModulesByRole = (rol: string | undefined): ModuleInfo[] => {
        if (!rol) return [];
        const modulesByRole: Record<string, ModuleInfo[]> = {
            admin: [
                { name: 'Granjas', path: '/gestion/granjas', icon: 'fa-warehouse', description: 'Administrar granjas' },
                { name: 'Programas', path: '/gestion/programas', icon: 'fa-clipboard-list', description: 'Gestionar programas' },
                { name: 'Lotes', path: '/gestion/lotes', icon: 'fa-tractor', description: 'Control de lotes' },
                { name: 'Cultivos', path: '/gestion/cultivos', icon: 'fa-leaf', description: 'Cultivos y especies' },
                { name: 'Plantas', path: '/gestion/plantas', icon: 'fa-seedling', description: 'Gestión de plantas' },
                { name: 'Usuarios', path: '/gestion/usuarios', icon: 'fa-users', description: 'Gestión de usuarios' },
                { name: 'Inventario', path: '/gestion/inventario', icon: 'fa-boxes', description: 'Control de inventario' },
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Diagnósticos agrícolas' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Recomendaciones' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Planificación de labores' },
                { name: 'Estadísticas', path: '/gestion/estadisticas', icon: 'fa-chart-bar', description: 'Ver estadísticas' }
            ],
            asesor: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Crear diagnósticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Emitir recomendaciones' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Seguir labores' },
                { name: 'Lotes', path: '/gestion/lotes', icon: 'fa-tractor', description: 'Consultar lotes' },
                { name: 'Programas', path: '/gestion/programas', icon: 'fa-clipboard-list', description: 'Ver programas' },
                { name: 'Inventario', path: '/gestion/inventario', icon: 'fa-boxes', description: 'Consultar inventario' },
            ],
            docente: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Evaluar diagnósticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Aprobar recomendaciones' },
                { name: 'Estadísticas', path: '/gestion/estadisticas', icon: 'fa-chart-bar', description: 'Ver estadísticas' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Supervisar labores' },
                { name: 'Programas', path: '/gestion/programas', icon: 'fa-clipboard-list', description: 'Gestionar programas' },
                { name: 'Lotes', path: '/gestion/lotes', icon: 'fa-tractor', description: 'Gestionar lotes' },
                { name: 'Cultivos', path: '/gestion/cultivos', icon: 'fa-leaf', description: 'Gestionar cultivos' },
                { name: 'Plantas', path: '/gestion/plantas', icon: 'fa-seedling', description: 'Gestionar plantas' },
                { name: 'Inventario', path: '/gestion/inventario', icon: 'fa-boxes', description: 'Gestionar inventario' },
            ],
            talento_humano: [
                { name: 'Tablero', path: '/tablero', icon: 'fa-th-large', description: 'Tablero de labores' },
                { name: 'Usuarios', path: '/gestion/usuarios', icon: 'fa-users', description: 'Gestionar personal' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Asignar labores' }
            ],
            jefe_talento_humano: [
                { name: 'Tablero', path: '/tablero', icon: 'fa-th-large', description: 'Tablero de labores' },
                { name: 'Usuarios', path: '/gestion/usuarios', icon: 'fa-users', description: 'Gestionar personal' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Asignar labores' },
                { name: 'Programas', path: '/gestion/programas', icon: 'fa-clipboard-list', description: 'Ver programas' },
                { name: 'Lotes', path: '/gestion/lotes', icon: 'fa-tractor', description: 'Ver lotes' },
                { name: 'Cultivos', path: '/gestion/cultivos', icon: 'fa-leaf', description: 'Ver cultivos' },
            ],
            estudiante: [
                { name: 'Diagnósticos', path: '/gestion/diagnosticos', icon: 'fa-stethoscope', description: 'Realizar diagnósticos' },
                { name: 'Recomendaciones', path: '/gestion/recomendaciones', icon: 'fa-lightbulb', description: 'Ver recomendaciones' }
            ],
            trabajador: [
                { name: 'Tablero', path: '/tablero', icon: 'fa-th-large', description: 'Tablero de tareas' },
                { name: 'Labores', path: '/gestion/labores', icon: 'fa-calendar-check', description: 'Ver mis labores' }
            ]
        };
        return modulesByRole[rol] || [];
    };

    const getRoleIcon = (rol: string | undefined): string => {
        if (!rol) return 'fa-user';
        const roleIcons: Record<string, string> = {
            admin: 'fa-crown',
            asesor: 'fa-chart-line',
            docente: 'fa-chalkboard-teacher',
            talento_humano: 'fa-user-tie',
            jefe_talento_humano: 'fa-briefcase',
            estudiante: 'fa-user-graduate',
            trabajador: 'fa-hard-hat'
        };
        return roleIcons[rol] || 'fa-user';
    };

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

    const isActive = (path: string): boolean => location.pathname === path;

    const toggleMobileMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMenu = () => setMobileMenuOpen(false);

    return (
        <header className="bg-white shadow-lg sticky top-0 z-50 border-b">
            {/* Fila superior */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex justify-between items-center gap-3">
                    {/* Logo */}
                    <div 
                        className="flex items-center space-x-2 sm:space-x-4 cursor-pointer group flex-1" 
                        onClick={() => navigate('/dashboard')}
                    >
                        <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white text-green-700 transition-transform group-hover:scale-105">
                            <img src="/icons/icon-512.png" alt="Sistema de granjas" className="h-8 w-8 sm:h-14 sm:w-14" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-2xl font-bold text-green-700">Sistema Granjas</h1>
                            <p className="hidden sm:block text-gray-500 text-xs">Gestión Agrícola y Pecuario</p>
                        </div>
                    </div>

                    {/* Usuario */}
                    {user ? (
                        <div className="flex items-center space-x-2">
                            <div className="hidden md:block text-right">
                                <div className="text-xs text-gray-500">{greeting},</div>
                                <div className="font-semibold text-gray-800 text-sm">{user.nombre}</div>
                                <div className="text-xs text-gray-500 capitalize flex items-center justify-end">
                                    <span className={`w-2 h-2 rounded-full ${roleColor.replace('bg-', 'bg-').replace('600', '400')} mr-1`}></span>
                                    {user.rol?.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <div className={`w-8 h-8 sm:w-12 sm:h-12 ${roleColor} rounded-full flex items-center justify-center shadow-md`}>
                                    <i className={`fas ${roleIcon} text-white text-xs sm:text-xl`}></i>
                                </div>
                                <LogoutButton variant="minimal" className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm" />
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-sm sm:text-base">
                            Iniciar Sesión
                        </Link>
                    )}
                </div>
            </div>

            {/* Navegación: desktop (horizontal) + móvil (hamburguesa) */}
            {user && !selectedModule && userModules.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        {/* Versión desktop */}
                        <div className="hidden sm:block relative">
                            <nav className="flex overflow-x-auto py-2 sm:py-3 space-x-1 sm:space-x-2 scrollbar-hide">
                                {userModules.map((module) => {
                                    const active = isActive(module.path);
                                    return (
                                        <Link
                                            key={module.path}
                                            to={module.path}
                                            className={`group relative flex items-center px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${active ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-700 hover:bg-green-50 hover:text-green-600'}`}
                                            title={module.description}
                                        >
                                            <i className={`fas ${module.icon} mr-2 text-sm ${active ? 'text-green-600' : 'text-gray-500 group-hover:text-green-500'}`}></i>
                                            <span>{module.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Versión móvil: botón hamburguesa + drawer */}
                        <div className="sm:hidden py-2">
                            <button
                                onClick={toggleMobileMenu}
                                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg px-3 py-2 transition"
                                aria-label="Menú de navegación"
                            >
                                <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                                <span className="text-sm font-medium">Módulos</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawer móvil (se muestra cuando mobileMenuOpen es true) */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 sm:hidden" aria-modal="true" role="dialog">
                    {/* Fondo oscuro */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeMenu}></div>
                    {/* Panel deslizable desde la izquierda (o derecha) */}
                    <div className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Módulos</h3>
                            <button onClick={closeMenu} className="p-2 rounded-full hover:bg-gray-100">
                                <i className="fas fa-times text-gray-500"></i>
                            </button>
                        </div>
                        <div className="p-3 space-y-1">
                            {userModules.map((module) => {
                                const active = isActive(module.path);
                                return (
                                    <Link
                                        key={module.path}
                                        to={module.path}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${active ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={closeMenu}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <i className={`fas ${module.icon} ${active ? 'text-green-600' : 'text-gray-500'}`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{module.name}</div>
                                            <div className="text-xs text-gray-500">{module.description}</div>
                                        </div>
                                        {active && <i className="fas fa-check-circle text-green-500"></i>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Título del módulo seleccionado */}
            {selectedModule && (
                <div className="border-t border-gray-200 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center space-x-3">
                                {onBack && (
                                    <button
                                        onClick={onBack}
                                        className="flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-white transition-all touch-manipulation"
                                        aria-label="Volver"
                                    >
                                        <i className="fas fa-arrow-left text-base sm:text-lg"></i>
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 line-clamp-1">{title}</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 capitalize flex items-center">
                                        <span className={`w-2 h-2 rounded-full ${roleColor} mr-2`}></span>
                                        Módulo: {selectedModule}
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-3 justify-end">
                                <button onClick={() => window.location.reload()} className="p-2 text-gray-500 hover:text-green-600 rounded-full hover:bg-white transition-all touch-manipulation" aria-label="Actualizar página">
                                    <i className="fas fa-sync-alt text-sm sm:text-base"></i>
                                </button>
                                <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-500 hover:text-green-600 rounded-full hover:bg-white transition-all touch-manipulation" aria-label="Ir al dashboard">
                                    <i className="fas fa-home text-sm sm:text-base"></i>
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