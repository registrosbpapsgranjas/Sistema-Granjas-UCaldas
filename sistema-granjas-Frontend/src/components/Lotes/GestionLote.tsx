// src/components/Lotes/GestionLote.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // 👈 Importar useSearchParams
import { toast } from "react-hot-toast";
import { loteService } from "../../services/loteService";
import granjaService from "../../services/granjaService";
import programaService from "../../services/programaService";
import { StatsCard } from "../Common/StatsCard";
import LotesTable from "./LotesTable";
import LoteForm from "./LotesForm";
import TiposLoteModal from "./TiposLote";
import exportService from "../../services/exportService";

interface GestionLotesProps {
    programaId?: string; // Para filtrar por programa específico
}

export default function GestionLotes({ programaId }: GestionLotesProps) {
    const [searchParams] = useSearchParams(); // 👈 Para query params
    const cultivoId = searchParams.get('cultivoId');
    const cultivoNombre = searchParams.get('cultivoNombre');
    
    console.log('📍 GestionLotes - programaId:', programaId);
    console.log('📍 GestionLotes - cultivoId:', cultivoId);
    console.log('📍 GestionLotes - cultivoNombre:', cultivoNombre);
    
    const navigate = useNavigate();
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
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

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

    // Handler para exportar lotes
    const handleExportLotes = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando lotes...');

        try {
            const loadingToast = toast.loading('Exportando lotes...');
            const result = programaId 
                ? await exportService.exportarLotesPorPrograma(Number(programaId))
                : await exportService.exportarLotes();

            toast.dismiss(loadingToast);
            toast.success('Lotes exportados exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error: any) {
            console.error('❌ Error exportando lotes:', error);
            toast.error('Error al exportar lotes', {
                duration: 4000,
                position: 'top-right'
            });
            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    // Formulario
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        tipo_lote_id: 0,
        granja_id: 0,
        programa_id: programaId ? Number(programaId) : 0,
        nombre_cultivo: "",
        tipo_gestion: "Convencional",
        fecha_inicio: new Date().toISOString().split('T')[0],
        duracion_dias: 30,
        estado: "activo",
        cultivo_id: null as number | null,
    });

    useEffect(() => {
        cargarDatos();
    }, [programaId, cultivoId]); // 👈 Recargar cuando cambie cultivoId

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            let filtro = '';
            if (programaId) filtro = `para programa ${programaId}`;
            else if (cultivoId) filtro = `para cultivo ${cultivoId}`;
            else filtro = 'todos';
            
            console.log(`🔄 Cargando datos de lotes... ${filtro}`);
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

            const [datosTiposLote, datosGranjas, datosProgramas] = await Promise.all([
                loteService.obtenerTiposLote(),
                granjaService.obtenerGranjas(),
                programaService.obtenerProgramas()
            ]);

            toast.dismiss(loadingToast);
            console.log(`✅ ${datosLotes.length} lotes cargados`);

            setLotes(datosLotes);
            setTiposLote(datosTiposLote);
            setGranjas(datosGranjas);
            setProgramas(datosProgramas);

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
            
            console.log('📤 Guardando lote...', datosEnvio);

            if (editando && loteSeleccionado) {
                await loteService.actualizarLote(loteSeleccionado.id, datosEnvio);
                console.log('✅ Lote actualizado');
            } else {
                await loteService.crearLote(datosEnvio);
                console.log('✅ Lote creado');
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
        setDatosFormulario({
            nombre: lote.nombre || "",
            tipo_lote_id: lote.tipo_lote_id || 0,
            granja_id: lote.granja_id || 0,
            programa_id: lote.programa_id || (programaId ? Number(programaId) : 0),
            nombre_cultivo: lote.nombre_cultivo || "",
            tipo_gestion: lote.tipo_gestion || "Convencional",
            fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            duracion_dias: lote.duracion_dias || 30,
            estado: lote.estado || "activo",
            cultivo_id: lote.cultivo_id || null,
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
            const loadingToast = toast.loading('Eliminando lote...');

            await loteService.eliminarLote(id);

            toast.dismiss(loadingToast);
            toast.success('Lote eliminado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Lote eliminado');
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
            nombre_cultivo: "",
            tipo_gestion: "Convencional",
            fecha_inicio: new Date().toISOString().split('T')[0],
            duracion_dias: 30,
            estado: "activo",
            cultivo_id: null,
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
            <div className="mb-6 flex gap-4">
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
            </div>

            {/* Tabla de lotes */}
            <LotesTable
                lotes={lotes}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
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