// src/components/Usuarios/AsignarGranjaModal.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { granjaService } from '../../services/granjaService';
import usuarioService from '../../services/usuarioService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario: any | null;
}

export function AsignarGranjaModal({ isOpen, onClose, usuario }: Props) {
  const [granjas, setGranjas] = useState<any[]>([]);
  const [asignadas, setAsignadas] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && usuario) {
      cargarGranjas();
    } else {
      setGranjas([]);
      setAsignadas(new Set());
      setProcesando(new Set());
    }
  }, [isOpen, usuario]);

  const cargarGranjas = async () => {
    setCargando(true);
    try {
      const [todas, asignadasList] = await Promise.all([
        granjaService.obtenerGranjas(),
        usuarioService.obtenerGranjasDeUsuario(usuario.id)
      ]);
      const lista = Array.isArray(todas) ? todas : (todas as any).items ?? [];
      setGranjas(lista);
      setAsignadas(new Set((asignadasList as any[]).map((g: any) => g.id)));
    } catch {
      toast.error('No se pudieron cargar las granjas');
    } finally {
      setCargando(false);
    }
  };

  const toggleAsignacion = async (granjaId: number, estaAsignada: boolean) => {
    setProcesando(prev => new Set(prev).add(granjaId));
    try {
      if (estaAsignada) {
        await granjaService.removerUsuario(granjaId, usuario.id);
        setAsignadas(prev => { const s = new Set(prev); s.delete(granjaId); return s; });
        toast.success('Granja removida del usuario');
      } else {
        await granjaService.asignarUsuario(granjaId, usuario.id);
        setAsignadas(prev => new Set(prev).add(granjaId));
        toast.success('Granja asignada correctamente');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la asignación');
    } finally {
      setProcesando(prev => { const s = new Set(prev); s.delete(granjaId); return s; });
    }
  };

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <i className="fas fa-tractor text-amber-600"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Granjas asignadas</h2>
              <p className="text-xs text-gray-500">{usuario.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
              <span className="text-sm">Cargando granjas...</span>
            </div>
          ) : granjas.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <i className="fas fa-tractor text-4xl mb-3 block text-gray-200"></i>
              <p className="text-sm">No hay granjas disponibles en el sistema</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {granjas.map((granja) => {
                const estaAsignada = asignadas.has(granja.id);
                const estaProcesando = procesando.has(granja.id);

                return (
                  <li
                    key={granja.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      estaAsignada
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* Info de la granja */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
                        estaAsignada ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        <i className={`fas fa-tractor text-sm ${estaAsignada ? 'text-amber-600' : 'text-gray-400'}`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{granja.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {granja.ubicacion || `Granja #${granja.id}`}
                        </p>
                      </div>
                    </div>

                    {/* Botón toggle */}
                    <button
                      onClick={() => toggleAsignacion(granja.id, estaAsignada)}
                      disabled={estaProcesando}
                      className={`flex-shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                        estaAsignada
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      {estaProcesando ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : estaAsignada ? (
                        <><i className="fas fa-minus"></i> Remover</>
                      ) : (
                        <><i className="fas fa-plus"></i> Asignar</>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {asignadas.size === 0
              ? 'Sin granjas asignadas'
              : `${asignadas.size} granja${asignadas.size !== 1 ? 's' : ''} asignada${asignadas.size !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
