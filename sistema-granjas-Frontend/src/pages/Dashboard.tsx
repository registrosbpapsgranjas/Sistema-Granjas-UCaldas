// pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import Sidebar from '../components/Common/SideBar';
import ModulesGrid from '../components/Common/ModulesGrid';
// Importa los servicios
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import usuarioService from '../services/usuarioService';
import laboresService from '../services/laboresService';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        granjasCount: 0,
        usuariosCount: 0,
        programasCount: 0,
        laboresMesCount: 0,
        loading: true
    });

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            // Obtener fecha actual y primer día del mes
            const ahora = new Date();
            const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

            // Formatear fechas para comparación
            const fechaInicio = primerDiaMes.toISOString().split('T')[0];
            const fechaFin = ultimoDiaMes.toISOString().split('T')[0];

            // Cargar todos los datos en paralelo
            const [granjas, programas, lotes, usuarios, laboresResponse] = await Promise.all([
                granjaService.obtenerGranjas(),
                programaService.obtenerProgramas(),
                loteService.obtenerLotes(),
                usuarioService.obtenerUsuarios(),
                laboresService.obtenerLabores() // Esta devuelve {items: [], total: X, paginas: X}
            ]);

            // Filtrar labores del mes actual - ahora laboresResponse.items
            const laboresEsteMes = Array.isArray(laboresResponse?.items) ?
                laboresResponse.items.filter(labor => {
                    if (!labor.fecha_asignacion) return false;

                    try {
                        const fechaLabor = new Date(labor.fecha_asignacion);
                        return fechaLabor >= primerDiaMes && fechaLabor <= ultimoDiaMes;
                    } catch (error) {
                        console.warn('Error parseando fecha de labor:', labor.fecha_asignacion);
                        return false;
                    }
                }) : [];

            // Validar que los datos sean arrays y obtener conteos
            // Asegurarse de que sean arrays antes de usar .length
            const granjasArray = Array.isArray(granjas) ? granjas : [];
            const programasArray = Array.isArray(programas) ? programas : [];
            const usuariosArray = Array.isArray(usuarios) ? usuarios : [];

            // Para lotes, verificar la estructura
            let lotesArray = [];
            if (Array.isArray(lotes)) {
                lotesArray = lotes;
            } else if (lotes && Array.isArray(lotes.items)) {
                lotesArray = lotes.items; // Si viene con estructura similar a labores
            }

            setStats({
                granjasCount: granjasArray.length,
                usuariosCount: usuariosArray.length,
                programasCount: programasArray.length,
                laboresMesCount: laboresEsteMes.length,
                loading: false
            });

        } catch (error) {
            console.error('Error cargando estadísticas del dashboard:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />

            <div className="flex">
                <Sidebar />

                {/* Contenido principal */}
                <main className="flex-1 ml-64 p-8">
                    {/* Banner de bienvenida */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 mb-8 text-white">
                        <h1 className="text-3xl font-bold mb-4">Bienvenido al Sistema de granjas</h1>
                        <p className="text-green-100 text-lg max-w-3xl">
                            Una plataforma integral para la gestión agrícola que conecta estudiantes,
                            sesiones, trabajadores y administradores en un ecosistema colaborativo
                            para optimizar la producción y el aprendizaje.
                        </p>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Granjas Activas */}
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            {stats.loading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-16"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                        {stats.granjasCount}
                                    </div>
                                    <div className="text-gray-600">Granjas Activas</div>
                                </>
                            )}
                        </div>

                        {/* Usuarios Registrados */}
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            {stats.loading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-16"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-3xl font-bold text-blue-600 mb-2">
                                        {stats.usuariosCount}
                                    </div>
                                    <div className="text-gray-600">Usuarios Registrados</div>
                                </>
                            )}
                        </div>

                        {/* Programas Activos */}
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            {stats.loading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-16"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-3xl font-bold text-purple-600 mb-2">
                                        {stats.programasCount}
                                    </div>
                                    <div className="text-gray-600">Programas Activos</div>
                                </>
                            )}
                        </div>

                        {/* Labores del Mes */}
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            {stats.loading ? (
                                <div className="animate-pulse">
                                    <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-16"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-3xl font-bold text-orange-600 mb-2">
                                        {stats.laboresMesCount}
                                    </div>
                                    <div className="text-gray-600">Labores del Mes</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Módulos del Sistema */}
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Módulos del Sistema</h2>
                            <button
                                onClick={cargarEstadisticas}
                                className="text-sm text-green-600 hover:text-green-800 flex items-center px-3 py-1 bg-green-50 rounded hover:bg-green-100"
                                disabled={stats.loading}
                            >
                                <i className={`fas ${stats.loading ? 'fa-spinner fa-spin' : 'fa-redo'} mr-2`}></i>
                                Actualizar estadísticas
                            </button>
                        </div>
                        <ModulesGrid navigate={navigate} />

                        {/* Información adicional */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <i className="fas fa-calendar-alt text-blue-500 text-xl mr-3"></i>
                                    <div>
                                        <h4 className="font-medium text-blue-800">Cálculo de labores</h4>
                                        <p className="text-blue-700 text-sm">
                                            Las "Labores del Mes" cuentan las actividades asignadas entre el
                                            {` ${new Date().getDate() === 1 ? '1' : '1ro'} y el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`}.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <i className="fas fa-database text-green-500 text-xl mr-3"></i>
                                    <div>
                                        <h4 className="font-medium text-green-800">Datos actualizados</h4>
                                        <p className="text-green-700 text-sm">
                                            Todas las estadísticas se obtienen en tiempo real desde la base de datos.
                                            Usa el botón "Actualizar" para refrescar los datos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;