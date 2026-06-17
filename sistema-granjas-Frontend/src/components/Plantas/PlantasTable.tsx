// src/components/Plantas/PlantasTable.tsx
import React from 'react';
import type { PlantaResponse } from '../../types/plantaTypes';

interface PlantasTableProps {
  plantas: PlantaResponse[];
  onEditar: (planta: PlantaResponse) => void;
  onEliminar: (id: number) => void;
  loteNombre?: string;
  canWrite?: boolean;
}

const PlantasTable: React.FC<PlantasTableProps> = ({
  plantas,
  onEditar,
  onEliminar,
  loteNombre,
  canWrite = true,
}) => {
  const plantasOrdenadas = [...plantas].sort((a, b) => {
    if (a.surco !== b.surco) return a.surco - b.surco;
    return a.numero - b.numero;
  });

  // 👇 NUEVA FUNCIÓN DE COLORES SEGÚN ESTADO
  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'productivo':
        return 'bg-green-100 text-green-800';
      case 'para_eliminar':
        return 'bg-red-100 text-red-800';
      case 'punto_vacio':
        return 'bg-gray-300 text-gray-700';  // Gris claro
      case 'observacion':
        return 'bg-blue-100 text-blue-800';  // Azul claro para observación
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 👇 TEXTO LEGIBLE PARA EL USUARIO
  const getEstadoTexto = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'productivo': return 'Productivo';
      case 'para_eliminar': return 'Para Eliminar';
      case 'punto_vacio': return 'Punto Vacío';
      case 'observacion': return 'Observación';
      default: return estado || 'Desconocido';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Plantas {loteNombre ? `- ${loteNombre}` : ''}
            </h3>
            <p className="text-sm text-gray-500">
              Mostrando {plantas.length} registros
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Surco
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha creación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plantasOrdenadas.map((planta) => (
              <tr key={planta.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {planta.codigo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {planta.surco}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {planta.numero}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(planta.estado)}`}>
                    {getEstadoTexto(planta.estado)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(planta.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {canWrite && (
                      <>
                        <button
                          onClick={() => onEditar(planta)}
                          className="text-yellow-600 hover:text-yellow-900 p-1.5 hover:bg-yellow-50 rounded transition-colors"
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => onEliminar(planta.id)}
                          className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {plantas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fas fa-seedling text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg mb-2">No hay plantas registradas</p>
            <p className="text-sm">
              Puedes crear plantas individualmente o usar "Generar desde lote"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantasTable;