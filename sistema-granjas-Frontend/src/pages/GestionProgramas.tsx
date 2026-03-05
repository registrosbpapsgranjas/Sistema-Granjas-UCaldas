// src/pages/GestionProgramasPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GestionProgramas from '../components/Programas/GestionProgramas';
import DashboardHeader from '../components/Common/DashboardHeader';

const GestionProgramasPage: React.FC = () => {
    const { granjaId } = useParams<{ granjaId: string }>();
    const navigate = useNavigate();
    
    // Determinar el título basado en si hay granjaId o no
    const title = granjaId 
        ? `Programas de la Granja` 
        : "Gestión de Programas";

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader
                title={title}
                selectedModule="programas"
                onBack={granjaId ? () => navigate("/granjas") : undefined}
            />
            <div className="container mx-auto px-4 py-8">
                <GestionProgramas />
            </div>
        </div>
    );
};

export default GestionProgramasPage;