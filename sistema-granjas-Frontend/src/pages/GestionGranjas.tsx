// src/pages/GestionGranjasPage.tsx
import React from 'react';
import GestionGranjas from '../components/Granjas/GestionGranjas';

const GestionGranjasPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
            <GestionGranjas />
        </div>
    </div>
);

export default GestionGranjasPage;