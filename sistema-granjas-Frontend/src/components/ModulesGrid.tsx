// components/ModulesGrid.tsx
import React from 'react';
import ModulesCard from "./ModulesCard";

interface ModulesGridProps {
    navigate: (path: string) => void;
}

const ModulesGrid: React.FC<ModulesGridProps> = ({ navigate }) => {
    const modules = [
        {
            id: 'granjas',
            title: 'Granjas',
            description: 'Gestiona las granjas registradas',
            icon: 'fas fa-tractor',
            color: 'bg-green-600',
            path: '/gestion/granjas'
        },
        {
            id: 'programas',
            title: 'Programas',
            description: 'Administra los programas agrícolas',
            icon: 'fas fa-seedling',
            color: 'bg-purple-600',
            path: '/gestion/programas'
        },
        {
            id: 'usuarios',
            title: 'Usuarios',
            description: 'Gestión de usuarios del sistema',
            icon: 'fas fa-users',
            color: 'bg-blue-600',
            path: '/gestion/usuarios'
        },
        {
            id: 'lotes', // ← Mismo ID que pasas a DashboardHeader
            title: 'Gestión de Lotes',
            description: 'Administra lotes, cultivos y parcelas',
            icon: 'fas fa-seedling',
            color: 'bg-blue-500',
            path: '/gestion/lotes', // ← Misma ruta que en App.tsx
            permission: 'admin'
        },
        {
            id: 'labores',
            title: 'Labores',
            description: 'Supervisa tareas y asignaciones',
            icon: 'fas fa-tasks',
            color: 'bg-orange-500',
            path: '/gestion/labores'
        }

    ];

    const handleAccess = (path: string) => {
        navigate(path);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module) => (
                <ModulesCard
                    key={module.id}
                    title={module.title}
                    description={module.description}
                    icon={module.icon}
                    color={module.color}
                    onClick={() => handleAccess(module.path)}
                />
            ))}
        </div>
    );
};

export default ModulesGrid;