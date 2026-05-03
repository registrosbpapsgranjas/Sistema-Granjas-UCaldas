import React, { useState, useEffect } from 'react';
import DashboardHeader from '../Common/DashboardHeader';
import SelectorPrograma from './SelectorPrograma';
import TiposInventarioList from './TiposInventarioList';
import TipoInventarioForm from './TipoInventarioForm';
import CamposInventarioList from './CamposInventarioList';
import CampoInventarioForm from './CampoInventarioForm';
import ItemsInventarioList from './ItemsInventarioList';
import ItemInventarioForm from './ItemInventarioForm';
import { inventarioDinamicoService } from '../../services/inventarioDinamicoService';
import type { TipoInventario, Campo, ItemInventario, TipoConItems } from '../../types/inventarioDinamicoTypes';
import { toast } from 'react-hot-toast';

const GestionInventarioDinamico: React.FC = () => {
  const [programaId, setProgramaId] = useState<number | null>(null);
  const [tipos, setTipos] = useState<TipoInventario[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoInventario | null>(null);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados modales
  const [modalTipo, setModalTipo] = useState(false);
  const [modalCampo, setModalCampo] = useState(false);
  const [modalItem, setModalItem] = useState(false);
  const [editandoTipo, setEditandoTipo] = useState<TipoInventario | null>(null);
  const [editandoCampo, setEditandoCampo] = useState<Campo | null>(null);
  const [editandoItem, setEditandoItem] = useState<ItemInventario | null>(null);

  useEffect(() => {
    if (programaId) {
      cargarTipos();
    }
  }, [programaId]);

  const cargarTipos = async () => {
    if (!programaId) return;
    setLoading(true);
    try {
      const data = await inventarioDinamicoService.listarTipos(programaId);
      setTipos(data);
      if (data.length > 0 && !tipoSeleccionado) {
        setTipoSeleccionado(data[0]);
        await cargarCamposItems(data[0].id);
      } else if (tipoSeleccionado) {
        const stillExists = data.find(t => t.id === tipoSeleccionado.id);
        if (stillExists) {
          await cargarCamposItems(tipoSeleccionado.id);
        } else if (data.length > 0) {
          setTipoSeleccionado(data[0]);
          await cargarCamposItems(data[0].id);
        } else {
          setTipoSeleccionado(null);
          setCampos([]);
          setItems([]);
        }
      }
    } catch (err) {
      toast.error('Error cargando tipos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCamposItems = async (tipoId: number) => {
    try {
      const completo: TipoConItems = await inventarioDinamicoService.obtenerTipoCompleto(tipoId);
      setCampos(completo.campos || []);
      setItems(completo.items || []);
    } catch (err) {
      toast.error('Error cargando campos/items');
    }
  };

  const handleSelectTipo = async (tipoId: number) => {
    const tipo = tipos.find(t => t.id === tipoId);
    if (tipo) {
      setTipoSeleccionado(tipo);
      await cargarCamposItems(tipoId);
    }
  };

  // CRUD Tipos
  const handleCrearTipo = async (data: any) => {
    if (!programaId) throw new Error('Seleccione programa');
    await inventarioDinamicoService.crearTipo({ ...data, programa_id: programaId });
    toast.success('Tipo creado');
    await cargarTipos();
  };
  const handleActualizarTipo = async (id: number, data: any) => {
    await inventarioDinamicoService.actualizarTipo(id, data);
    toast.success('Tipo actualizado');
    await cargarTipos();
  };
  const handleEliminarTipo = async (id: number) => {
    if (confirm('¿Eliminar tipo y todos sus campos e items?')) {
      await inventarioDinamicoService.eliminarTipo(id);
      toast.success('Tipo eliminado');
      await cargarTipos();
      if (tipoSeleccionado?.id === id) setTipoSeleccionado(null);
    }
  };

  // CRUD Campos
  const handleCrearCampo = async (data: any) => {
    if (!tipoSeleccionado) throw new Error('Seleccione un tipo');
    await inventarioDinamicoService.crearCampo({ ...data, tipo_id: tipoSeleccionado.id });
    toast.success('Campo creado');
    await cargarCamposItems(tipoSeleccionado.id);
  };
  const handleActualizarCampo = async (id: number, data: any) => {
    await inventarioDinamicoService.actualizarCampo(id, data);
    toast.success('Campo actualizado');
    await cargarCamposItems(tipoSeleccionado!.id);
  };
  const handleEliminarCampo = async (id: number) => {
    if (confirm('¿Eliminar este campo? Los datos se perderán.')) {
      await inventarioDinamicoService.eliminarCampo(id);
      toast.success('Campo eliminado');
      await cargarCamposItems(tipoSeleccionado!.id);
    }
  };

  // CRUD Items
  const handleCrearItem = async (data: any) => {
    if (!tipoSeleccionado) throw new Error('Seleccione un tipo');
    await inventarioDinamicoService.crearItem({ ...data, tipo_id: tipoSeleccionado.id });
    toast.success('Registro creado');
    await cargarCamposItems(tipoSeleccionado.id);
  };
  const handleActualizarItem = async (id: number, data: any) => {
    await inventarioDinamicoService.actualizarItem(id, data);
    toast.success('Registro actualizado');
    await cargarCamposItems(tipoSeleccionado!.id);
  };
  const handleEliminarItem = async (id: number) => {
    if (confirm('¿Eliminar este registro?')) {
      await inventarioDinamicoService.eliminarItem(id);
      toast.success('Registro eliminado');
      await cargarCamposItems(tipoSeleccionado!.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <SelectorPrograma onProgramaChange={setProgramaId} programaIdSeleccionado={programaId || undefined} />

        {programaId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div className="lg:col-span-1">
              <TiposInventarioList
                tipos={tipos}
                selectedTipoId={tipoSeleccionado?.id}
                onSelectTipo={handleSelectTipo}
                onEdit={(tipo) => { setEditandoTipo(tipo); setModalTipo(true); }}
                onDelete={handleEliminarTipo}
                onCreate={() => { setEditandoTipo(null); setModalTipo(true); }}
              />
            </div>
            <div className="lg:col-span-2">
              {tipoSeleccionado ? (
                <>
                  <h2 className="text-xl font-bold mb-2">{tipoSeleccionado.nombre}</h2>
                  <CamposInventarioList
                    campos={campos}
                    onEdit={(campo) => { setEditandoCampo(campo); setModalCampo(true); }}
                    onDelete={handleEliminarCampo}
                    onCreate={() => { setEditandoCampo(null); setModalCampo(true); }}
                  />
                  <ItemsInventarioList
                    items={items}
                    campos={campos}
                    onEdit={(item) => { setEditandoItem(item); setModalItem(true); }}
                    onDelete={handleEliminarItem}
                    onCreate={() => { setEditandoItem(null); setModalItem(true); }}
                  />
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  Selecciona un tipo de inventario o crea uno nuevo.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Selecciona un programa para comenzar.</div>
        )}

        {/* Modales */}
        <TipoInventarioForm
          isOpen={modalTipo}
          onClose={() => { setModalTipo(false); setEditandoTipo(null); }}
          onSave={editandoTipo ? (data) => handleActualizarTipo(editandoTipo.id, data) : handleCrearTipo}
          tipo={editandoTipo || undefined}
        />
        <CampoInventarioForm
          isOpen={modalCampo}
          onClose={() => { setModalCampo(false); setEditandoCampo(null); }}
          onSave={editandoCampo ? (data) => handleActualizarCampo(editandoCampo.id, data) : handleCrearCampo}
          campo={editandoCampo || undefined}
        />
        <ItemInventarioForm
          isOpen={modalItem}
          onClose={() => { setModalItem(false); setEditandoItem(null); }}
          onSave={editandoItem ? (data) => handleActualizarItem(editandoItem.id, data) : handleCrearItem}
          campos={campos}
          item={editandoItem || undefined}
        />
      </div>
    </div>
  );
};

export default GestionInventarioDinamico;