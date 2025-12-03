import React from "react";
import StatsCard from "./StatsCard";
import { type DashboardStats } from "../types/dashboardTypes";

interface Props {
    stats: DashboardStats;
}

const StatsGrid: React.FC<Props> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard icon="fas fa-tractor" color="bg-green-600"
                value={stats.granjasActivas} label="Granjas Activas" />

            <StatsCard icon="fas fa-users" color="bg-blue-600"
                value={stats.usuariosRegistrados} label="Usuarios Registrados" />

            <StatsCard icon="fas fa-seedling" color="bg-purple-600"
                value={stats.programasActivos} label="Programas Activos" />

            <StatsCard icon="fas fa-tasks" color="bg-orange-500"
                value={stats.laboresMes} label="Labores del Mes" />
        </div>
    );
};

export default StatsGrid;
