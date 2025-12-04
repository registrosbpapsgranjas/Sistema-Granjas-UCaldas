import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import GestionCultivos from '../components/GestionCultivos';

const GestionCultivosPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Cultivos/Especies"
            selectedModule="cultivos"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionCultivos />
        </div>
    </div>
);

export default GestionCultivosPage;