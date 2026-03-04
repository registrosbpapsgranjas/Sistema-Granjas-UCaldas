// src/pages/GestionGranjasPage.tsx
import React from 'react';
import GestionProgramas from '../components/Programas/GestionProgramas';

const GestionProgramasPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
            <GestionProgramas />
        </div>
    </div>
);

export default GestionProgramasPage;