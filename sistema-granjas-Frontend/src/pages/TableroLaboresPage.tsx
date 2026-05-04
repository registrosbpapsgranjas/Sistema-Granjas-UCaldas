// src/pages/TableroLaboresPage.tsx
import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import TableroLabores from '../components/Labores/TableroLabores';

const TableroLaboresPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Tablero de Tareas"
        selectedModule="labores"
        onBack={() => window.history.back()}
      />
      <TableroLabores />
    </div>
  );
};

export default TableroLaboresPage;
