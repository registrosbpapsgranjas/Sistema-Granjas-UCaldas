// src/pages/GestionLotesPage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionLotes from '../components/Lotes/GestionLote';

const GestionLotesPage: React.FC = () => {
    const { programaId } = useParams<{ programaId: string }>();
    const navigate = useNavigate();
    
    console.log('📍 GestionLotesPage - programaId:', programaId);
    
    const title = programaId 
        ? "Lotes del Programa" 
        : "Gestión de Lotes";

    const handleBack = () => {
        if (programaId) {
            navigate(`/programas/${programaId}`);
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader
                title={title}
                selectedModule="lotes"
                onBack={handleBack}
            />
            <div className="container mx-auto px-4 py-8">
                <GestionLotes programaId={programaId} />
            </div>
        </div>
    );
};

export default GestionLotesPage;