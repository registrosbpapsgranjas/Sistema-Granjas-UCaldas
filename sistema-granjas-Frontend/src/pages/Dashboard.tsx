// pages/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import Sidebar from '../components/SideBar';
import ModulesGrid from '../components/ModulesGrid';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />

            <div className="flex">
                <Sidebar />

                {/* Contenido principal */}
                <main className="flex-1 ml-64 p-8">
                    {/* Banner de bienvenida */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 mb-8 text-white">
                        <h1 className="text-3xl font-bold mb-4">Bienvenido al Sistema AgroTech UCaldas</h1>
                        <p className="text-green-100 text-lg max-w-3xl">
                            Una plataforma integral para la gestión agrícola que conecta estudiantes,
                            sesiones, trabajadores y administradores en un ecosistema colaborativo
                            para optimizar la producción y el aprendizaje.
                        </p>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">4</div>
                            <div className="text-gray-600">Granjas Activas</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">9</div>
                            <div className="text-gray-600">Usuarios Registrados</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">13</div>
                            <div className="text-gray-600">Programas Activos</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-2">3</div>
                            <div className="text-gray-600">Labores del Mes</div>
                        </div>
                    </div>

                    {/* Módulos del Sistema */}
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Módulos del Sistema</h2>
                        <ModulesGrid navigate={navigate} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;