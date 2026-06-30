// src/components/Lotes/GestionLote.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { puedeEscribir } from "../../utils/permissions";
import { toast } from "react-hot-toast";
import { loteService } from "../../services/loteService";
import granjaService from "../../services/granjaService";
import programaService from "../../services/programaService";
import { StatsCard } from "../Common/StatsCard";
import LotesTable from "./LotesTable";
import LoteForm from "./LotesForm";
import TiposLoteModal from "./TiposLote";
import exportService from "../../services/exportService";
import ExportButton from "../Common/ExportButton";

interface GestionLotesProps {
    programaId?: string;
}

export default function GestionLotes({ programaId }: GestionLotesProps) {
    const [searchParams] = useSearchParams();
    const cultivoId = searchParams.get('cultivoId');
    const cultivoNombre = searchParams.get('cultivoNombre');

    const navigate = useNavigate();
    const { user } = useAuth();
    const canWrite = puedeEscribir(user?.rol, 'lotes');
    const [lotes, setLotes] = useState<any[]>([]);
    const [tiposLote, setTiposLote] = useState<any[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [nombrePrograma, setNombrePrograma] = useState<string>('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modales
    const [modalCrear, setModalCrear] = useState(false);
    const [modalTiposLote, setModalTiposLote] = useState(false);

    // Selecciones
    const [loteSeleccionado, setLoteSeleccionado] = useState<any>(null);
    const [editando, setEditando] = useState(false);

    // Cargar nombre del programa si hay programaId
    useEffect(() => {
        const cargarNombrePrograma = async () => {
            if (programaId) {
                try {
                    const programa = await programaService.obtenerProgramaPorId(Number(programaId));
                    setNombrePrograma(programa.nombre);
                } catch (error) {
                    console.error('Error al cargar nombre del programa:', error);
                }
            }
        };
        cargarNombrePrograma();
    }, [programaId]);


    // Formulario - AGREGADOS surcos, plantas_por_surco y cultivos_ids
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        tipo_lote_id: 0,
        granja_id: 0,
        programa_id: programaId ? Number(programaId) : 0,
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: "activo",
        surcos: null as number | null,
        plantas_por_surco: null as number | null,
        cultivos_ids: [] as number[],
    });

    useEffect(() => {
        cargarDatos();
    }, [programaId, cultivoId]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            const loadingToast = toast.loading('Cargando datos de lotes...');

            // Obtener lotes según filtros
            let datosLotes;
            if (programaId) {
                datosLotes = await loteService.obtenerLotesPorPrograma(Number(programaId));
            } else if (cultivoId) {
                datosLotes = await loteService.obtenerLotesPorCultivo(Number(cultivoId));
            } else {
                datosLotes = await loteService.obtenerLotes();
            }

            // Asegurar que datosLotes sea un array
            const lotesArray = Array.isArray(datosLotes) ? datosLotes : (datosLotes?.items || []);

            const [datosTiposLote, datosGranjas, datosProgramas] = await Promise.all([
                loteService.obtenerTiposLote(),
                granjaService.obtenerGranjas(),
                programaService.obtenerProgramas()
            ]);

            toast.dismiss(loadingToast);

            setLotes(lotesArray);
            setTiposLote(Array.isArray(datosTiposLote) ? datosTiposLote : []);
            setGranjas(Array.isArray(datosGranjas) ? datosGranjas : []);
            setProgramas(Array.isArray(datosProgramas) ? datosProgramas : []);

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos');
            toast.error('Error al cargar los datos de lotes', {
                duration: 4000,
                position: 'top-right'
            });
        } finally {
            setCargando(false);
        }
    };

    const manejarCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            
            const datosEnvio = { ...datosFormulario };
            if (programaId && !datosEnvio.programa_id) {
                datosEnvio.programa_id = Number(programaId);
            }
            
            // Convertir surcos y plantas_por_surco a números o null
            if (datosEnvio.surcos === '' || datosEnvio.surcos === undefined) datosEnvio.surcos = null;
            if (datosEnvio.plantas_por_surco === '' || datosEnvio.plantas_por_surco === undefined) datosEnvio.plantas_por_surco = null;

            console.log('📤 Guardando lote...', datosEnvio);

            if (editando && loteSeleccionado) {
                await loteService.actualizarLote(loteSeleccionado.id, datosEnvio);
            } else {
                await loteService.crearLote(datosEnvio);
            }

            await cargarDatos();
            setModalCrear(false);
            setEditando(false);
            resetFormulario();

        } catch (error: any) {
            console.error('❌ Error guardando lote:', error);
            setError(error.message || 'Error al guardar el lote');
            throw error;
        }
    };

    const abrirEditar = (lote: any) => {
        // Obtener los IDs de cultivos desde la relación lote_cultivo o cultivos_asignados
        const cultivosIds = lote.cultivos_ids || 
                           lote.cultivos_asignados?.map((lc: any) => lc.cultivo_id) || 
                           (lote.cultivos ? lote.cultivos.map((c: any) => c.id) : []);
        
        setDatosFormulario({
            nombre: lote.nombre || "",
            tipo_lote_id: lote.tipo_lote_id || 0,
            granja_id: lote.granja_id || 0,
            programa_id: lote.programa_id || (programaId ? Number(programaId) : 0),
            fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            estado: lote.estado || "activo",
            surcos: lote.surcos ?? null,
            plantas_por_surco: lote.plantas_por_surco ?? null,
            cultivos_ids: cultivosIds,
        });
        setLoteSeleccionado(lote);
        setEditando(true);
        setModalCrear(true);
    };

    const manejarEliminar = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de eliminar este lote?\nEsta acción no se puede deshacer.");
        if (!confirmar) return;

        try {
            setError(null);
            await loteService.eliminarLote(id);
            toast.success('Lote eliminado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar lote:', error);
            setError(error.message || 'Error al eliminar el lote');
            toast.error(`Error al eliminar lote: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const resetFormulario = () => {
        setDatosFormulario({
            nombre: "",
            tipo_lote_id: 0,
            granja_id: 0,
            programa_id: programaId ? Number(programaId) : 0,
            fecha_inicio: new Date().toISOString().split('T')[0],
            estado: "activo",
            surcos: null,
            plantas_por_surco: null,
            cultivos_ids: [],
        });
    };

    // Determinar título
    const titulo = cultivoNombre 
        ? `Lotes con cultivo: ${decodeURIComponent(cultivoNombre)}`
        : programaId 
            ? `Lotes del programa` 
            : 'Gestión de Lotes';

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">
                    {programaId ? 'Cargando lotes del programa...' : 
                     cultivoId ? 'Cargando lotes del cultivo...' : 
                     'Cargando lotes...'}
                </span>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Botones de acción */}
            <div className="mb-6 flex gap-4 items-center flex-wrap">
                <ExportButton onExport={() => programaId ? exportService.exportarLotesPorPrograma(Number(programaId)) : exportService.exportarLotes()} />
                {canWrite && (
                  <>
                  <button
                      onClick={() => {
                          resetFormulario();
                          setEditando(false);
                          setModalCrear(true);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                      <i className="fas fa-plus"></i>
                      {programaId ? 'Nuevo Lote en este Programa' : 'Nuevo Lote'}
                  </button>

                  <button
                      onClick={() => setModalTiposLote(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                      <i className="fas fa-cog"></i>
                      Gestionar Tipos de Lote
                  </button>
                  </>
                )}
            </div>

            {/* Tabla de lotes */}
            <LotesTable
                lotes={lotes}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
                canWrite={canWrite}
            />

            {/* Modal de formulario */}
            <LoteForm
                isOpen={modalCrear}
                onClose={() => {
                    setModalCrear(false);
                    setEditando(false);
                    resetFormulario();
                }}
                datosFormulario={datosFormulario}
                setDatosFormulario={setDatosFormulario}
                onSubmit={manejarCrear}
                editando={editando}
                tiposLote={tiposLote}
                granjas={granjas}
                programas={programas}
                programaIdFijo={programaId ? Number(programaId) : undefined}
            />

            {/* Modal de tipos de lote */}
            <TiposLoteModal
                isOpen={modalTiposLote}
                onClose={() => setModalTiposLote(false)}
                tiposLote={tiposLote}
                onRefresh={cargarDatos}
            />
        </div>
    );
}