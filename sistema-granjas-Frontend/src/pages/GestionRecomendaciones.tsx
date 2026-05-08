// src/pages/GestionRecomendacionesPage.tsx
import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionRecomendaciones from '../components/Recomendaciones/GestionRecomendaciones';

const GestionRecomendacionesPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader
                selectedModule="recomendaciones"
                onBack={() => window.history.back()}
            />
            <div className="container mx-auto px-4 py-8">
                <GestionRecomendaciones />
            </div>
        </div>
    );
};

export default GestionRecomendacionesPage;