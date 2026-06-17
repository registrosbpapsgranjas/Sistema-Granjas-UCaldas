// src/components/Plantas/PlantaForm.tsx
import React from "react";
import Modal from "../Common/Modal";
import type { PlantaCreate } from "../../types/plantaTypes";

interface LoteOption {
  id: number;
  nombre: string;
  surcos: number;
  plantas_por_surco: number;
}

interface PlantaFormProps {
  isOpen: boolean;
  onClose: () => void;
  datosFormulario: PlantaCreate;
  setDatosFormulario: React.Dispatch<React.SetStateAction<PlantaCreate>>;
  onSubmit: (e: React.FormEvent) => void;
  editando: boolean;
  lotes: LoteOption[];
  erroresValidacion?: Record<string, string>;
}

const ESTADOS = [
  { value: "productivo", label: "Productivo", color: "green" },
  { value: "para_eliminar", label: "Para Eliminar", color: "red" },
  { value: "punto_vacio", label: "Punto Vacío", color: "gray" },
  { value: "observacion", label: "Observación", color: "blue" },
];

const PlantaForm: React.FC<PlantaFormProps> = ({
  isOpen,
  onClose,
  datosFormulario,
  setDatosFormulario,
  onSubmit,
  editando,
  lotes,
  erroresValidacion = {},
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({
      ...prev,
      [name]: name === "lote_id" ? Number(value) : value,
    }));
  };

  const getError = (campo: string) => erroresValidacion[campo] || "";

  const loteSeleccionado = lotes.find((l) => l.id === datosFormulario.lote_id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-2xl">
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">
          {editando ? "Editar Planta" : "Nueva Planta"}
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
            {/* Lote */}
            <div>
              <label className="block mb-1">Lote *</label>
              <select
                name="lote_id"
                value={datosFormulario.lote_id || 0}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  getError("lote_id") ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={editando}
              >
                <option value={0}>Seleccionar lote</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre} (Surcos: {l.surcos} | Plantas/surco: {l.plantas_por_surco})
                  </option>
                ))}
              </select>
              {getError("lote_id") && (
                <p className="text-red-500 text-sm mt-1">{getError("lote_id")}</p>
              )}
            </div>

            {/* Surco y número */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Surco *</label>
                <input
                  type="number"
                  name="surco"
                  value={datosFormulario.surco}
                  onChange={handleChange}
                  min={1}
                  max={loteSeleccionado?.surcos || 999}
                  className={`w-full p-2 border rounded ${
                    getError("surco") ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {getError("surco") && (
                  <p className="text-red-500 text-sm mt-1">{getError("surco")}</p>
                )}
                {loteSeleccionado && (
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {loteSeleccionado.surcos}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1">Número de planta *</label>
                <input
                  type="number"
                  name="numero"
                  value={datosFormulario.numero}
                  onChange={handleChange}
                  min={1}
                  max={loteSeleccionado?.plantas_por_surco || 999}
                  className={`w-full p-2 border rounded ${
                    getError("numero") ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {getError("numero") && (
                  <p className="text-red-500 text-sm mt-1">{getError("numero")}</p>
                )}
                {loteSeleccionado && (
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo por surco: {loteSeleccionado.plantas_por_surco}
                  </p>
                )}
              </div>
            </div>

            {/* 👇 NUEVO: Estado de la planta */}
            <div>
              <label className="block mb-1">Estado *</label>
              <select
                name="estado"
                value={datosFormulario.estado || "productivo"}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  getError("estado") ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                {ESTADOS.map((est) => (
                  <option key={est.value} value={est.value}>
                    {est.label}
                  </option>
                ))}
              </select>
              {getError("estado") && (
                <p className="text-red-500 text-sm mt-1">{getError("estado")}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Productivo: planta sana. Para Eliminar: planta enferma o muerta. Punto Vacío: espacio sin planta.
              </p>
            </div>

            {/* Código (solo lectura) */}
            {editando && datosFormulario.codigo && (
              <div>
                <label className="block mb-1">Código</label>
                <input
                  type="text"
                  value={datosFormulario.codigo}
                  disabled
                  className="w-full p-2 border rounded bg-gray-100"
                />
              </div>
            )}

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

export default PlantaForm;