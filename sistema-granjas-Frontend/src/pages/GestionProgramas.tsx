// src/pages/GestionProgramasPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GestionProgramas from '../components/Programas/GestionProgramas';
import DashboardHeader from '../components/Common/DashboardHeader';
import granjaService from '../services/granjaService';

const GestionProgramasPage: React.FC = () => {
    const { granjaId } = useParams<{ granjaId: string }>();
    const navigate = useNavigate();
    const [nombreGranja, setNombreGranja] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);
    
    console.log('📍 GestionProgramasPage - granjaId:', granjaId);
    
    useEffect(() => {
        const cargarNombreGranja = async () => {
            if (granjaId) {
                try {
                    setCargando(true);
                    const granja = await granjaService.obtenerGranjaPorId(Number(granjaId));
                    setNombreGranja(granja.nombre);
                } catch (error) {
                    console.error('Error al cargar nombre de la granja:', error);
                    setNombreGranja('(desconocida)');
                } finally {
                    setCargando(false);
                }
            } else {
                setCargando(false);
            }
        };
        
        cargarNombreGranja();
    }, [granjaId]);
    
    // Determinar el título basado en si hay granjaId o no
    const title = granjaId 
        ? `Programas: ${nombreGranja || '...'}` 
        : "Gestión de Programas";

    // Función para manejar el botón de retroceso
    const handleBack = () => {
        if (granjaId) {
            navigate("/gestion/granjas");
        } else {
            navigate("/dashboard");
        }
    };

    if (cargando && granjaId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información de la granja...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader
                title={title}
                selectedModule="programas"
                onBack={handleBack}
            />
            <div className="container mx-auto px-4 py-8">
                <GestionProgramas />
            </div>
        </div>
    );
};

export default GestionProgramasPage;