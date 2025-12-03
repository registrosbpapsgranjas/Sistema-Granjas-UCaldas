// src/pages/GestionUsuariosPage.tsx
import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import GestionUsuarios from '../components/GestionUsuario';

const GestionUsuariosPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Usuarios"
            selectedModule="usuarios"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionUsuarios />
        </div>
    </div>
);

export default GestionUsuariosPage;