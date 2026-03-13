import React from "react";
import Modal from "../Common/Modal";
import type { Granja } from "../../types/granjaTypes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  datosFormulario: Partial<Granja>;
  setDatosFormulario: (data: Partial<Granja>) => void;
  onSubmit: (e: React.FormEvent) => void;
  editando: boolean;
}

export const GranjaForm: React.FC<Props> = ({
  isOpen,
  onClose,
  datosFormulario,
  setDatosFormulario,
  onSubmit,
  editando
}) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose}>

      <h3 className="text-xl font-bold mb-4">
        {editando ? "Editar Granja" : "Nueva Granja"}
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">

        <div>
          <label className="block text-sm mb-1">Nombre</label>

          <input
            type="text"
            required
            value={datosFormulario.nombre || ""}
            onChange={(e) =>
              setDatosFormulario({
                ...datosFormulario,
                nombre: e.target.value
              })
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Ubicación</label>

          <input
            type="text"
            required
            value={datosFormulario.ubicacion || ""}
            onChange={(e) =>
              setDatosFormulario({
                ...datosFormulario,
                ubicacion: e.target.value
              })
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div className="flex items-center">

          <input
            type="checkbox"
            checked={datosFormulario.activo ?? true}
            onChange={(e) =>
              setDatosFormulario({
                ...datosFormulario,
                activo: e.target.checked
              })
            }
          />

          <label className="ml-2 text-sm">Granja activa</label>

        </div>

        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {editando ? "Actualizar" : "Crear"}
          </button>

        </div>

      </form>
    </Modal>
  );
};