// src/pages/GestionLaboresPage.tsx
import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionLabores from '../components/Labores/GestionLabores';

const GestionLaboresPage: React.FC = () => {
    React.useEffect(() => { document.title = 'Gestión de Labores'; }, []);
    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader
                title="Gestión de Labores"
                selectedModule="labores"
                onBack={() => window.history.back()}
            />
            <div className="container mx-auto px-4 py-8">
                <GestionLabores />
            </div>
        </div>
    );
};

export default GestionLaboresPage;