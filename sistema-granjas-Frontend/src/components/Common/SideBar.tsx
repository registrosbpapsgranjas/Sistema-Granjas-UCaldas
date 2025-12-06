// components/Sidebar.tsx
import React from 'react';

interface SidebarProps {
    isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
    if (!isOpen) return null;

    return (
        <aside className="w-64 bg-white shadow-lg h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto">
            <div className="p-4">
                {/* Sección: Resumen del Sistema */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Resumen del Sistema
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-chart-bar w-4"></i>
                                <span>Estadísticas Generales</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-sync w-4"></i>
                                <span>Estado Sincronización</span>
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Sección: Seguridad */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Seguridad y Accesos
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-shield-alt w-4"></i>
                                <span>Backup y Restauración</span>
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Sección: Configuración Rápida */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Configuración Rápida
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-tractor w-4"></i>
                                <span>Registrar Nueva Granja</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-user-tie w-4"></i>
                                <span>Crear Nuevo Asesor</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-seedling w-4"></i>
                                <span>Crear Nuevo Programa</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-map-marked-alt w-4"></i>
                                <span>Crear Nuevo Lote</span>
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Sección: Jerarquía del Sistema */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Jerarquía del Sistema
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-tractor w-4"></i>
                                <span>Granjas</span>
                                <span className="text-xs text-gray-400">Contienen programas</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded ml-4">
                                <i className="fas fa-user-tie w-4"></i>
                                <span>Asesores</span>
                                <span className="text-xs text-gray-400">Asignados a programas</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded">
                                <i className="fas fa-seedling w-4"></i>
                                <span>Programas</span>
                                <span className="text-xs text-gray-400">Tienen su propio asesor</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded ml-4">
                                <i className="fas fa-map-marked-alt w-4"></i>
                                <span>Lotes</span>
                                <span className="text-xs text-gray-400">Pertenecen a programas</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;