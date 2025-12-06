// src/pages/GestionProgramasPage.tsx
import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionProgramas from '../components/Programas/GestionPrograma';

const GestionProgramasPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Programas"
            selectedModule="programas"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionProgramas />
        </div>
    </div>
);

export default GestionProgramasPage;