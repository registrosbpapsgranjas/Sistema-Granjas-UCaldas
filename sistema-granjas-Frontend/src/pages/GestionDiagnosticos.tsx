import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionDiagnosticos from '../components/Diagnosticos/GestionDiagnosticos';

const GestionDiagnosticosPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Diagnósticos"
            selectedModule="diagnosticos"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionDiagnosticos />
        </div>
    </div>
);

export default GestionDiagnosticosPage;