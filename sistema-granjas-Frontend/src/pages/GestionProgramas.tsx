// src/pages/GestionProgramasPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GestionProgramas from '../components/Programas/GestionProgramas';
import DashboardHeader from '../components/Common/DashboardHeader';

const GestionProgramasPage: React.FC = () => {
    const { granjaId } = useParams<{ granjaId: string }>();
    const navigate = useNavigate();
    
    console.log('📍 GestionProgramasPage - granjaId:', granjaId);
    
    // Determinar el título basado en si hay granjaId o no
    const title = granjaId 
        ? `Programas de la Granja` 
        : "Gestión de Programas";

    // Función para manejar el botón de retroceso
    const handleBack = () => {
        if (granjaId) {
            navigate("/gestion/granjas");
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader
                title={title}
                selectedModule="programas"
                onBack={handleBack}  // ← CORREGIDO: pasamos la función, no la ejecutamos
            />
            <div className="container mx-auto px-4 py-8">
                <GestionProgramas />
            </div>
        </div>
    );
};

export default GestionProgramasPage;