// components/Sidebar.tsx
import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import exportService from '../../services/exportService';
// Importa los servicios que necesites
import granjaService from '../../services/granjaService';
import programaService from '../../services/programaService';
import loteService from '../../services/loteService';
import usuarioService from '../../services/usuarioService';

interface SidebarProps {
    isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
    const { user } = useAuth();
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const [stats, setStats] = useState({
        granjasCount: 0,
        programasCount: 0,
        lotesCount: 0,
        usuariosCount: 0,
        loading: true
    });

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            // Ejecutar todas las llamadas en paralelo
            const [granjas, programas, lotes, usuarios] = await Promise.all([
                granjaService.obtenerGranjas(),
                programaService.obtenerProgramas(),
                loteService.obtenerLotes(),
                usuarioService.obtenerUsuarios()
            ]);
            console.log(granjas, programas, lotes, usuarios, "Marlon");

            setStats({
                granjasCount: Array.isArray(granjas) ? granjas.length : 0,
                programasCount: Array.isArray(programas) ? programas.length : 0,
                lotesCount: Array.isArray(lotes) ? lotes.length : 0,
                usuariosCount: Array.isArray(usuarios) ? usuarios.length : 0,
                loading: false
            });
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            // Si hay error, mantener los valores por defecto
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    if (!isOpen) return null;

    // Función para determinar qué elementos puede ver cada rol
    const canSee = (requiredRoles: string[]) => {
        if (!user || !user.rol) return false;
        return requiredRoles.includes(user.rol);
    };

    // Función para exportar backup
    const handleExportBackup = async () => {
        if (exporting) return;

        setExporting(true);
        setExportMessage('Preparando exportación...');

        try {
            const result = await exportService.exportarBackupCompleto();
            setExportMessage(`¡Exportación completada! (${result.filename})`);

            setTimeout(() => {
                setExportMessage('');
            }, 5000);
        } catch (error) {
            console.error('❌ Error en exportación:', error);
            setExportMessage('Error al exportar. Verifica tu conexión.');

            setTimeout(() => {
                setExportMessage('');
            }, 5000);
        } finally {
            setExporting(false);
        }
    };

    return (
        <aside className="w-64 bg-white shadow-lg h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto border-r border-gray-200">
            <div className="p-4">
                {/* Información rápida del usuario */}
                {user && (
                    <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-white"></i>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{user.nombre}</p>
                                <p className="text-xs text-gray-600 capitalize">{user.rol?.replace('_', ' ') || 'Usuario'}</p>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            <i className="fas fa-clock mr-1"></i>
                            Último acceso: Hoy
                        </div>
                    </div>
                )}

                {/* Estadísticas rápidas */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        <i className="fas fa-chart-pie mr-2"></i>
                        Estadísticas Rápidas
                    </h3>
                    {stats.loading ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-gray-100 p-2 rounded text-center">
                                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-1"></div>
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 p-2 rounded text-center">
                                <div className="text-lg font-bold text-blue-700">{stats.granjasCount}</div>
                                <div className="text-xs text-blue-600">Granjas</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded text-center">
                                <div className="text-lg font-bold text-green-700">{stats.programasCount}</div>
                                <div className="text-xs text-green-600">Programas</div>
                            </div>
                            <div className="bg-amber-50 p-2 rounded text-center">
                                <div className="text-lg font-bold text-amber-700">{stats.lotesCount}</div>
                                <div className="text-xs text-amber-600">Lotes</div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded text-center">
                                <div className="text-lg font-bold text-purple-700">{stats.usuariosCount}</div>
                                <div className="text-xs text-purple-600">Usuarios</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Acciones rápidas por rol */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        <i className="fas fa-bolt mr-2"></i>
                        Acciones Rápidas
                    </h3>
                    <ul className="space-y-1">
                        {canSee(['admin', 'asesor', 'docente']) && (
                            <li>
                                <a href="/gestion/granjas" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <i className="fas fa-tractor w-4 text-green-500"></i>
                                    <span>Ver Granjas</span>
                                </a>
                            </li>
                        )}

                        {canSee(['admin', 'asesor', 'docente']) && (
                            <li>
                                <a href="/gestion/programas" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <i className="fas fa-seedling w-4 text-green-500"></i>
                                    <span>Ver Programas</span>
                                </a>
                            </li>
                        )}

                        {canSee(['admin']) && (
                            <li>
                                <a href="/gestion/usuarios" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <i className="fas fa-user-edit w-4 text-blue-500"></i>
                                    <span>Gestionar Usuarios</span>
                                </a>
                            </li>
                        )}

                        {canSee(['admin', 'docente', 'asesor']) && (
                            <li>
                                <a href="/gestion/inventario" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <i className="fas fa-box-open w-4 text-amber-500"></i>
                                    <span>Ver Inventario</span>
                                </a>
                            </li>
                        )}

                        {canSee(['admin', 'asesor', 'docente', 'estudiante']) && (
                            <li>
                                <a href="/gestion/diagnosticos" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <i className="fas fa-stethoscope w-4 text-teal-500"></i>
                                    <span>Crear Diagnóstico</span>
                                </a>
                            </li>
                        )}

                        {canSee(['admin', 'asesor', 'docente']) && (
                            <li>
                                <a href="/gestion/recomendaciones" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <i className="fas fa-lightbulb w-4 text-purple-500"></i>
                                    <span>Crear Recomendación</span>
                                </a>
                            </li>
                        )}

                        {canSee(['admin', 'talento_humano']) && (
                            <li>
                                <a href="/gestion/labores" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <i className="fas fa-tasks w-4 text-orange-500"></i>
                                    <span>Asignar Labores</span>
                                </a>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Jerarquía del Sistema */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        <i className="fas fa-sitemap mr-2"></i>
                        Jerarquía del Sistema
                    </h3>
                    <div className="space-y-2 pl-2 border-l-2 border-green-200 ml-2">
                        <a href="/gestion/granjas" className="block p-2 hover:bg-green-50 rounded">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <i className="fas fa-tractor text-green-600 text-xs"></i>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Granjas</span>
                                    <div className="text-xs text-gray-500">{stats.granjasCount} activas</div>
                                </div>
                            </div>
                        </a>

                        <div className="ml-6 space-y-2 border-l-2 border-blue-200 pl-2">
                            <a href="/gestion/programas" className="block p-2 hover:bg-blue-50 rounded">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <i className="fas fa-seedling text-blue-600 text-xs"></i>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Programas</span>
                                        <div className="text-xs text-gray-500">{stats.programasCount} en ejecución</div>
                                    </div>
                                </div>
                            </a>

                            <div className="ml-6 space-y-2 border-l-2 border-amber-200 pl-2">
                                <a href="/gestion/lotes" className="block p-2 hover:bg-amber-50 rounded">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                            <i className="fas fa-th-large text-amber-600 text-xs"></i>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Lotes</span>
                                            <div className="text-xs text-gray-500">{stats.lotesCount} registrados</div>
                                        </div>
                                    </div>
                                </a>

                                <div className="ml-6 space-y-1">
                                    <div className="text-xs text-gray-500 p-2">Contiene:</div>
                                    <a href="/gestion/cultivos" className="block p-1 hover:bg-gray-50 rounded">
                                        <div className="flex items-center space-x-2">
                                            <i className="fas fa-leaf text-green-500 text-xs ml-1"></i>
                                            <span className="text-xs text-gray-600">Cultivos</span>
                                        </div>
                                    </a>
                                    <a href="/gestion/diagnosticos" className="block p-1 hover:bg-gray-50 rounded">
                                        <div className="flex items-center space-x-2">
                                            <i className="fas fa-stethoscope text-teal-500 text-xs ml-1"></i>
                                            <span className="text-xs text-gray-600">Diagnósticos</span>
                                        </div>
                                    </a>
                                    <a href="/gestion/recomendaciones" className="block p-1 hover:bg-gray-50 rounded">
                                        <div className="flex items-center space-x-2">
                                            <i className="fas fa-lightbulb text-purple-500 text-xs ml-1"></i>
                                            <span className="text-xs text-gray-600">Recomendaciones</span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Herramientas del Sistema */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        <i className="fas fa-tools mr-2"></i>
                        Herramientas
                    </h3>
                    <ul className="space-y-1">
                        {canSee(['admin']) && (
                            <li className="mb-2">
                                <button
                                    onClick={handleExportBackup}
                                    disabled={exporting}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded w-full text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-database'} w-4 text-blue-500`}></i>
                                    <span className="flex-1">{exporting ? 'Exportando Backup...' : 'Exportar Backup Completo'}</span>
                                </button>
                                {exportMessage && (
                                    <div className={`text-xs mt-1 ml-2 px-2 py-1 rounded ${exportMessage.includes('Error')
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-green-100 text-green-600'
                                        }`}>
                                        {exportMessage}
                                    </div>
                                )}
                            </li>
                        )}

                    </ul>
                </div>

                {/* Información del Sistema */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                        <div className="flex items-center justify-between mb-1">
                            <span>Sistema:</span>
                            <span className="font-medium">Sistema de granjas V1.0</span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                            <span>Estado:</span>
                            <span className="text-green-600 font-medium">● Operativo</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Base de datos:</span>
                            <span className="text-blue-600">PostgreSQL</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;