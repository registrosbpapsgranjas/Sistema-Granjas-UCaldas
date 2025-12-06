import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionInventario from '../components/Inventarios/GestionInventarios';

const GestionInventarioPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Inventario"
            selectedModule="inventario"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionInventario />
        </div>
    </div>
);

export default GestionInventarioPage;