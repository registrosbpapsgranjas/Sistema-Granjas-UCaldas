// pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import DashboardHeader from '../components/Common/DashboardHeader';
import Sidebar from '../components/Common/SideBar';
// Importa los servicios
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import usuarioService from '../services/usuarioService';
import laboresService from '../services/laboresService';

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [laboresPorDia, setLaboresPorDia] = useState<any[]>([]);
    const [usuariosPorRol, setUsuariosPorRol] = useState<any[]>([]);
    const [proximasLabores, setProximasLabores] = useState<any[]>([]);
    const [resumenLotes, setResumenLotes] = useState({ total: 0, activos: 0, produccion: 0 });

    useEffect(() => {
        cargarDatosDashboard();
    }, []);

    const cargarDatosDashboard = async () => {
        try {
            setLoading(true);
            const ahora = new Date();

            // 1. Obtener labores para el gráfico de últimos 7 días y próximas labores
            const laboresResponse = await laboresService.obtenerLabores(); // { items, total, paginas }
            const labores = Array.isArray(laboresResponse?.items) ? laboresResponse.items : [];

            // Calcular labores por día (últimos 7 días)
            const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() - i);
                return fecha.toISOString().split('T')[0];
            }).reverse();

            const conteoPorDia = ultimos7Dias.map(fecha => {
                const count = labores.filter(l => l.fecha_asignacion?.startsWith(fecha)).length;
                return { fecha, Cantidad: count };
            });
            setLaboresPorDia(conteoPorDia);

            // Próximas labores (fecha futura, ordenadas)
            const hoy = new Date().toISOString().split('T')[0];
            const futuras = labores
                .filter(l => l.fecha_asignacion && l.fecha_asignacion >= hoy)
                .sort((a, b) => (a.fecha_asignacion || '').localeCompare(b.fecha_asignacion || ''))
                .slice(0, 5);
            setProximasLabores(futuras);

            // 2. Usuarios por rol
            const usuarios = await usuarioService.obtenerUsuarios();
            const usuariosArray = Array.isArray(usuarios) ? usuarios : [];
            const rolesMap = new Map();
            usuariosArray.forEach(u => {
                const rol = u.rol || 'Sin rol';
                rolesMap.set(rol, (rolesMap.get(rol) || 0) + 1);
            });
            const rolesData = Array.from(rolesMap.entries()).map(([name, value]) => ({ name, value }));
            setUsuariosPorRol(rolesData);

            // 3. Lotes (resumen)
            const lotes = await loteService.obtenerLotes();
            let lotesArray = [];
            if (Array.isArray(lotes)) lotesArray = lotes;
            else if (lotes?.items) lotesArray = lotes.items;

            const totalLotes = lotesArray.length;
            const activos = lotesArray.filter(l => l.estado === 'activo').length; // Ajusta según tu estado
            const produccion = lotesArray.filter(l => l.etapa === 'produccion').length; // Ajusta
            setResumenLotes({ total: totalLotes, activos: activos, produccion: produccion });

            setLoading(false);
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            setLoading(false);
        }
    };

    // Función para navegar a una ruta
    const irA = (ruta: string) => navigate(ruta);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardHeader />
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Cargando dashboard...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-64 p-8">
                    {/* Banner de bienvenida */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 mb-8 text-white">
                        <h1 className="text-3xl font-bold mb-4">Bienvenido al Sistema Granjas</h1>
                        <p className="text-green-100 text-lg max-w-3xl">
                            Una plataforma integral para la gestión agrícola que conecta estudiantes,
                            sesiones, trabajadores y administradores en un ecosistema colaborativo
                            para optimizar la producción y el aprendizaje.
                        </p>
                    </div>

                    {/* Fila de gráficos principales */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Gráfico de labores por día */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-chart-line text-green-500 mr-2"></i>
                                Labores por día (últimos 7 días)
                            </h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={laboresPorDia} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="fecha" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="Cantidad" stroke="#10b981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Gráfico de usuarios por rol */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-users text-blue-500 mr-2"></i>
                                Usuarios por rol
                            </h2>
                            {usuariosPorRol.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={usuariosPorRol}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {usuariosPorRol.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">No hay datos de usuarios</p>
                            )}
                        </div>
                    </div>

                    {/* Segunda fila: próximas labores + resumen lotes + acciones rápidas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Próximas labores */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-calendar-alt text-orange-500 mr-2"></i>
                                Próximas labores
                            </h2>
                            {proximasLabores.length > 0 ? (
                                <ul className="space-y-3">
                                    {proximasLabores.map((labor, idx) => (
                                        <li key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <span className="font-medium">{labor.nombre || 'Labor'}</span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(labor.fecha_asignacion).toLocaleDateString('es-ES')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center py-6">No hay labores programadas</p>
                            )}
                            <button
                                onClick={() => irA('/labores')}
                                className="mt-4 text-green-600 hover:text-green-800 font-medium flex items-center"
                            >
                                Ver todas <i className="fas fa-arrow-right ml-1"></i>
                            </button>
                        </div>

                        {/* Resumen de lotes */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-tractor text-green-500 mr-2"></i>
                                Resumen de lotes
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-green-600">{resumenLotes.total}</div>
                                    <div className="text-sm text-gray-600">Total lotes</div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-blue-600">{resumenLotes.activos}</div>
                                    <div className="text-sm text-gray-600">Activos</div>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg text-center col-span-2">
                                    <div className="text-3xl font-bold text-yellow-600">{resumenLotes.produccion}</div>
                                    <div className="text-sm text-gray-600">En producción</div>
                                </div>
                            </div>
                            {/* Mini donut con CSS (opcional) */}
                            <div className="mt-4 flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                                    {Math.round((resumenLotes.activos / (resumenLotes.total || 1)) * 100)}%
                                </div>
                            </div>
                            <button
                                onClick={() => irA('/lotes')}
                                className="mt-4 text-green-600 hover:text-green-800 font-medium flex items-center"
                            >
                                Gestionar lotes <i className="fas fa-arrow-right ml-1"></i>
                            </button>
                        </div>

                        {/* Acciones rápidas */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-rocket text-purple-500 mr-2"></i>
                                Acciones rápidas
                            </h2>
                            <div className="space-y-3">
                                <button
                                    onClick={() => irA('/granjas/nueva')}
                                    className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition"
                                >
                                    <i className="fas fa-plus-circle text-green-500 mr-3"></i>
                                    <span>Nueva granja</span>
                                </button>
                                <button
                                    onClick={() => irA('/usuarios/nuevo')}
                                    className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition"
                                >
                                    <i className="fas fa-user-plus text-blue-500 mr-3"></i>
                                    <span>Registrar usuario</span>
                                </button>
                                <button
                                    onClick={() => irA('/labores/nueva')}
                                    className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition"
                                >
                                    <i className="fas fa-calendar-plus text-orange-500 mr-3"></i>
                                    <span>Asignar labor</span>
                                </button>
                                <button
                                    onClick={() => irA('/reportes')}
                                    className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition"
                                >
                                    <i className="fas fa-file-pdf text-red-500 mr-3"></i>
                                    <span>Generar reporte</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Nota informativa */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-start">
                        <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5"></i>
                        <div>
                            <strong>Datos actualizados en tiempo real.</strong> Los gráficos reflejan la información actual de la base de datos. Para ver cambios, recarga la página.
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;