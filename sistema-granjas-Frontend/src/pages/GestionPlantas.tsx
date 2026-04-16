import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionPlanta from '../components/Plantas/GestionPlantas.tsx';

const GestionPlantasPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Plantas"
            selectedModule="plantas"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionPlanta />
        </div>
    </div>
);

export default GestionPlantasPage;