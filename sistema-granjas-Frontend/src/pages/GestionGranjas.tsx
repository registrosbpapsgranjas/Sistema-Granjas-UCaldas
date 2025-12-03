// src/pages/GestionGranjasPage.tsx
import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import GestionGranjas from '../components/GestionGranjas';

const GestionGranjasPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Granjas"
            selectedModule="granjas"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionGranjas />
        </div>
    </div>
);

export default GestionGranjasPage;