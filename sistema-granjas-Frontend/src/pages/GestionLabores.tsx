// src/pages/GestionLaboresPage.tsx
import React from 'react';
import DashboardHeader from '../components/DashboardHeader';

const GestionLaboresPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Labores"
            selectedModule="labores"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <i className="fas fa-tasks text-6xl text-orange-500 mb-4"></i>
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Labores</h1>
                    <p className="text-gray-600 mt-2">Módulo en desarrollo</p>
                </div>
            </div>
        </div>
    </div>
);

export default GestionLaboresPage;