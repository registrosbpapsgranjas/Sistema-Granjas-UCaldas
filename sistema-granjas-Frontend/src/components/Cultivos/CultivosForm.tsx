import React from "react";
import Modal from "../Common/Modal";
import type { CultivoFormData } from "../../types/cultivoTypes";

interface Granja {
  id: number;
  nombre: string;
}

interface CultivoFormProps {
  isOpen: boolean;
  onClose: () => void;
  datosFormulario: CultivoFormData;
  setDatosFormulario: React.Dispatch<React.SetStateAction<CultivoFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  editando: boolean;
  granjas: Granja[];
  erroresValidacion?: Record<string, string>;
}

const CultivoForm: React.FC<CultivoFormProps> = ({
  isOpen,
  onClose,
  datosFormulario,
  setDatosFormulario,
  onSubmit,
  editando,
  granjas,
  erroresValidacion = {},
}) => {

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {

    const { name, value } = e.target;

    setDatosFormulario((prev) => ({
      ...prev,
      [name]: name === "granja_id" ? Number(value) : value,
    }));
  };

  const getError = (campo: string) => erroresValidacion[campo] || "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-2xl">
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">
          {editando ? "Editar Cultivo" : "Nuevo Cultivo"}
        </h3>

        {Object.keys(erroresValidacion).length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc pl-5">
              {Object.entries(erroresValidacion).map(([campo, msg]) => (
                <li key={campo}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="space-y-4">

            {/* Nombre */}
            <div>
              <label className="block mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={datosFormulario.nombre}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  getError("nombre") ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {getError("nombre") && (
                <p className="text-red-500 text-sm mt-1">{getError("nombre")}</p>
              )}
            </div>

            {/* Tipo y Estado */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block mb-1">Tipo *</label>
                <select
                  name="tipo"
                  value={datosFormulario.tipo}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded ${
                    getError("tipo") ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="agricola">Agrícola</option>
                  <option value="pecuario">Pecuario</option>
                </select>

                {getError("tipo") && (
                  <p className="text-red-500 text-sm mt-1">{getError("tipo")}</p>
                )}
              </div>

              <div>
                <label className="block mb-1">Estado *</label>
                <select
                  name="estado"
                  value={datosFormulario.estado}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded ${
                    getError("estado") ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>

                {getError("estado") && (
                  <p className="text-red-500 text-sm mt-1">{getError("estado")}</p>
                )}
              </div>
            </div>

            {/* Granja */}
            <div>
              <label className="block mb-1">Granja *</label>
              <select
                name="granja_id"
                value={datosFormulario.granja_id}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  getError("granja_id") ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value={0}>Seleccionar</option>
                {granjas.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>

              {getError("granja_id") && (
                <p className="text-red-500 text-sm mt-1">
                  {getError("granja_id")}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={datosFormulario.descripcion}
                onChange={handleChange}
                rows={3}
                placeholder="Mínimo 10 caracteres"
                className={`w-full p-2 border rounded ${
                  getError("descripcion") ? "border-red-500" : "border-gray-300"
                }`}
              />

              {getError("descripcion") && (
                <p className="text-red-500 text-sm mt-1">
                  {getError("descripcion")}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                {editando ? "Actualizar" : "Crear"}
              </button>
            </div>

          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CultivoForm;