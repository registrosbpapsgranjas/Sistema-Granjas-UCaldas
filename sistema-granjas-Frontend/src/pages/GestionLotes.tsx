// src/pages/GestionLotesPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionLotes from '../components/Lotes/GestionLote';
import programaService from '../services/programaService';

const GestionLotesPage: React.FC = () => {
    const { programaId } = useParams<{ programaId: string }>();
    const navigate = useNavigate();
    const [nombrePrograma, setNombrePrograma] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);
    
    console.log('📍 GestionLotesPage - programaId:', programaId);
    
    useEffect(() => {
        const cargarNombrePrograma = async () => {
            if (programaId) {
                try {
                    setCargando(true);
                    const programa = await programaService.obtenerProgramaPorId(Number(programaId));
                    setNombrePrograma(programa.nombre);
                } catch (error) {
                    console.error('Error al cargar nombre del programa:', error);
                    setNombrePrograma('(desconocido)');
                } finally {
                    setCargando(false);
                }
            } else {
                setCargando(false);
            }
        };
        
        cargarNombrePrograma();
    }, [programaId]);
    
    // Determinar el título basado en si hay programaId o no
    const title = programaId 
        ? `Lotes: ${nombrePrograma || '...'}` 
        : "Gestión de Lotes";

    // Función para manejar el botón de retroceso
    const handleBack = () => {
        if (programaId) {
            navigate("/gestion/programas");
        } else {
            navigate("/dashboard");
        }
    };

    if (cargando && programaId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del programa...</p>
                </div>
            </div>
        );
    }

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