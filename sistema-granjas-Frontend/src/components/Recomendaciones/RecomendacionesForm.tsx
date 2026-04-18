// src/components/Recomendaciones/RecomendacionFormFCC.tsx
import React, { useState, useEffect } from 'react';
import diagnosticoService from '../../services/diagnosticoService';
import type { Recomendacion } from '../../types/recomendacionTypes';

interface RecomendacionFormFCCProps {
    recomendacion?: Recomendacion;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    currentUser: any;
    esEdicion?: boolean;
}

// Datos estáticos de productos (podrían venir de la BD)
const HERBICIDAS = [
    "Amina 720 SL - IA: 2,4 D Amina acido - DR: 0.4 L/ha - PC: NA PR: 12h - R. ICA: 941",
    "Profiamina 480 SL - IA: 2,4-D 480 g/l - DR: 0.5 L/ha - PC: NA PR: 0h - R. ICA: 1234",
    "Roundup brio - IA: Glifosato 363 gr/l - DR: 3-5 L/ha - PC: NA PR: 0h - R. ICA: 470",
    "Roundup activo - IA: Glifosato 363 gr/l - DR: 3-5 L/ha - PC: NA PR: 0h - R. ICA: 470",
    "FINALE SL - IA: Glufosinato de amonio 150gr/l - DR: 1.5 -2 L/ha - PC: NA PR: 0h - R. ICA: 2451",
    "Destierro SL - IA: Glufosinato de amonio 150gr/l - DR: 1.3 L/ha - PC: NA PR: 0h - R. ICA: 991",
    "Safari - IA: Glufosinato de amonio 200g/l - DR: 1.75-2 L/ha - PC: 7d PR: 0h - R. ICA: 1841",
    "Fascinate 280 SL - IA: Glufosinato de amonio 280 g/L - DR: 0.8 - 1 L/ha - PC: NA PR: 0h - R. ICA: 1674",
    "Trusinate 80 SG - IA: Glufosinato de amonio 800 gr/kg - DR: 400 g/ha - PC: NA PR: 0h - R. ICA: 2425",
    "Guadaña 75 - IA: Halosulfuron-methyl 750 g/kg - DR: 150 g/ha - PC: NA PR: 0 - R. ICA: PL0006832023",
    "Verdict 1400 - IA: Haloxyfop-R-metil éster - DR: 500 cc/ha - PC: 60d PR: 12h - R. ICA: 1187",
    "GRAMAFIN SL - IA: Paraquat ion 200g/l - DR: 1.5 L/ha - PC: NA PR: 0h - R. ICA: PL0003832023",
    "Stomp 400 EC - IA: Pendimethalin 400g/L - DR: 3 L/ha - PC: NA PR: 0h - R. ICA: NA"
];

const FUNGICIDAS = [
    "Stomp 400 EC - IA: Manconzeb - DR: 1 kg/ha - PC: 5d PR: 4h - R. ICA: 2463",
    "EcoSwing - IA: Swinglea - DR: 1.5 cc/L - PC: NA PR: NA R. ICA: 5950",
    "Xilotrom - IA: 1,8 cineo l- DR: 1.5 L/ha - PC: NA PR: NA - R. ICA: 12495",
    "Mirage 45 EC - IA: Prochloraz 450 g/L- DR: 1.0 cc/L- PC: 7d PR: 24h - R. ICA: 1169",
    "Rhapsody - IA: Bacillus subtillis 1x109 UFC/g- DR: 2.5- 10 mm/L - PC: NA PR: 12h - R. ICA: 5798",
    "Nativo - IA: Tebuconazole 200 g/L+ Trifloxystrobin 100g/L- DR: 0.5-0.6 L/ha - PC: 20d PR: 4h - R. ICA: PL0007322023",
    "Polycal - IA: Polisulfuro de calcio 200 g/l - DR: 1.12 L/ha- PC: 7d PR: 4h - R. ICA: PL0003682025",
    "Yodosáfer SL - IA: Yodo Polivinil Pirrolidona 120 g/L- DR: 2.5 L/ha - PC: 7d PR: 4h - R. ICA: PL0019222023",
    "Kumulus WG - IA: Azufre 800 g/kg - DR 1 - 2 kg/ha - PC: 1d PR: 4h - R. ICA: 2614",
    "Amistar Top - IA: Azoxystrobin 200g/L + Difenoconazol 125g/L - DR: 400 cc/ha (Papaya); 600 cc/ha (Naranja) - PC: 7d PR: 4h - R. ICA: 297",
    "Cobrethane - IA: Mancozeb + Oxicloruro de cobre - DR: 2 kg/ha - PC: 21d PR: 4h - R. ICA: 2153",
    "Antrasin - IA: SULFATO DE COBRE-CALCIO - DR: 1kg - PC: NA PR: 4h - R. ICA: PL0014822023",
    "Skuper - IA: Sulfato de cobre pentahidratado - DR: 0,3 L/ha - PC: NA PR: 4h - R. ICA: PL0020792023"
];

const INSECTICIDAS = [
    "Exalt 60 SC - IA: Spinetoram 60 g/L - DR: 100 cc/ha - PC: 1d PR: 4h - R. ICA: 528",
    "Ciperex - IA: Cipermetrina 200 gr/L - DR: 0.3 L/ha - PC: 21d PR: 4h - R. ICA: 14",
    "Acerrado 20 EC - IA: Cipermetrina 200 gr/L - DR: 250 cc/ha - PC: 7d PR: 4h - R. ICA: 473",
    "Citroemulsión - IA: Aceite mineral - DR: 3 cc/L - PC: NA PR: 4h - R. ICA: 1971",
    "Succes GF - 120 - IA: Spinosad 0.24 g/L - DR: 1.6 L/ha - PC: NA PR: 4h - R. ICA: 125",
    "Alisín - IA: Ajo 100 g/L, Ají 100 g/L, Limoneno 7.76 g/L, Disulfuro de alilo 12.61 g/L, Capsaicina 0.48 g/L, Ácido nicotínico 1.94 g/L, Carotenoides 23.28 g/L - DR: 1 cc/L - PC: NA PR: 2h - R. ICA: 4356",
    "Bonfyton - IA: Ácidos grasos 12 %, Sales potásicas 5%, Tenso activos 8,5 %, Dipentenos 6%, Emulsificantes 5%, Álcalis potásico 0.5%, Solventes 63 % - DR: 2 -3 ml/L - PC: NA PR: NA - R. ICA: 299-26072011",
    "Certus 70WP - IA: Thiametoxam 700 g/Kg - DR: 0,8g/L - PC: 7d PR: 4h - R. ICA: 19622023",
    "Sáfertac - IA: Poliisobutileno en un medio de aceite mineral y plastificante - DR: 1L - PC: NA PR: NA - R. ICA: NA",
    "Cebofrut - IA: N-orgánico 24,7 g/L, Boro total 11g/L, Carbono orgánico oxidable total 33g/L - DR: 30cc/200cc - PC: NA PR: NA - R. ICA: 9989",
    "Tropimmezcla - IA: Beauveria bassiana, Metarhizium anisopliae, Paecilomyces lilacinus, Trichoderma y Saccharomyces cerevisiae - DR: 2.5g/L - PC: NA PR: NA - R. ICA: 6113",
    "Micosis - IA: Beauveria Bassiana - DR: 750 - 1000 g/ha - PC: NA PR: NA - R. ICA: 6051",
    "Safermix - IA: Beauveria Bassiana, Metarhizium anisopliae, Lecanicillium lecanni, Bacillus thuringiensis var Kurstaki - DR: 1g/L - PC: NA PR: NA - R. ICA: 9560"
];

const FERTILIZANTES_FOLIARES = [
    "Creciplant - COMP: 38 – 5 – 4 – CaO 0.1 – MgO 0.1 – S 0.1 – Bo 0.05 – Co 0.002 – Cu 0.02 – Fe 0-03 – Mn 0.01 – Mo 5 – Zn 0.1 /R. ICA: 9418",
    "Sulfato de Cobre + Potasio SYS - COMP: 0 – 0 – 3 – S 11 – Cu 24 – Mo 5 – Zn 2.5 /R. ICA: 70579",
    "Fertinvesa - COMP: 101g/L – 0 – 51.5g/L – CaO 750g/L – B 19g/L /R. ICA: 9492",
    "Cal 40 - COMP: N 60.5g/L – CaO 788.2g/L /R. ICA: 12774",
    "Globafol NF - COMP: 44.8g/L – 0 – 124g/L /R. ICA: 7928",
    "Terra-Sorb - COMP: 31g/L /R. ICA: 2134",
    "BOROZINC COMPLET – COMP: S 30g/L – B 100g/L – Cu 10g/L – Mo 5g/L – Zn50 g/L /R. ICA: 8084",
    "Induplant - COMP: 0 – 400g/L – 280g/L /R. ICA: 9566",
    "Algaplant - COMP: K2O 30g/L – CaO 4g/L – MgO 2g/L – S 53g/L – Fe 2g/L /R. ICA: 10709",
    "Calcio - B - Zn - COMP: K2O 140g/L – CaO 90.52 g/L – B 30g/L – Zn 30 g/L /R. ICA: 7417"
];

const FERTILIZANTES_SUELO = [
    "Mezcla Física - COMP: 25 – 4 – 24 /R. ICA: 3537",
    "KCL Granular - COMP: K2O 60 – CL 45 /R. ICA: 6935",
    "Forkamix Papa - COMP: 10 – 20 – 20 – CaO 3.2 – MgO 3.2 – S 1.8 – SiO 3.2 /R. ICA: 5416",
    "YaraLiva Nitrabor - COMP: 15.4 – 0 – 0 – CaO 25.6 – B 0.3 /R. ICA: 2583",
    "Nutrifeed Inicio - COMP: 12 – 30 – 10 – MgO 0.4 –S 8 – B 0.05 – Cu 0.08 – Fe 0.05 – Mn 0.08 – Mo 0.01 – Zn 0.03 /R. ICA: 3121",
    "Basifós Pró Active - COMP: 0 – 24 – 0 – CaO 28 – S 6 /R. ICA: 6121",
    "Yara Mila Hydran - COMP: 19 – 4 – 19 – MgO 3 – S 1.8 – B 0.1 – Zn 1.0 /R. ICA: 4143",
    "Bórax técnico-K - COMP: 0 – 3 – 0 – B 14 /R. ICA: 2005",
    "NUTRIMON - COMP: NA /R. ICA: NA",
    "VICOR - COMP: 3 – 0 – 0 –CaO 15 – MgO 5 – S 3 – B 1 – Cu 0.02 – Mo 0.005 – Zn 2.5 /R. ICA: 6219",
    "DOLGOS - COMP: 0 – 5 – 0 – CaO 12 – MgO 29 /R. ICA: 3319",
    "Triphos - COMP: 10 – 25 – 0 – CaO 13 – MgO 0.8 – S 11 – Zn 0.6 /R. ICA: 12957",
    "NUTRIHUMIC - COMP: 0 – 3 – 3 – CaO 3.8 – MgO 1.4 – S 0.8 – Fe 2.31 – SiO2 29 – Na 0.18 /R. ICA: 5496",
    "Manubor - COMP: NA/ R. ICA: NA",
    "Sulcamac - COMP: 0 – 3 – 0 – CaO 25 – MgO 13 – S 8 /R. ICA: 1018",
    "Oxical Mg - COMP: 0 – 0 – 4 – CaO 24 – MgO 15 /R. ICA: 12143",
    "Fosfatomonoamónico (MAP) - COMP: 10 – 10 – 0 /R. ICA: NA",
    "Tierra diatomea - COMP: Si 55.55 /R. ICA: 9865",
    "DOLOMITA - COMP: CaO 35 – MgO 15 /R. ICA: 5546",
    "AGRIMINS - COMP: 8 – 5 – 0 – CaO 18 – MgO 6 – S 1.6 – Bo 1 – Co 0.14 – Mo 5 – Zn 2.5 /R. ICA: 2359",
    "Magkierita - C OMP: : 0 – 0 – 3 – MgO 25 – S 6.5 /R. ICA: 10415",
    "SILI-CAL MAG - COMP: 0 – 3 – 0 – CaO 30 – MgO 13 – Mo 20 /R. ICA: 7438",
    "MAP - COMP: 11 – 52 – 0 /R. ICA: 12728",
    "Powder - COMP: NA/R. ICA: NA",
    "SILIVAL - COMP: 0 – 3 – 0 – CaO 21 – MgO 5.5 – S 1.7 – Si 26 /R. ICA: 10373",
    "Timac Agro - COMP: 8 – 24 – 10 – CaO 9 – S 6 – Bo 0.2 /R. ICA: 6120",
    "Cal Hidratada - COMP: NA /R. ICA: NA",
    "Oxido de Magnesio - COMP: MgO 88/R. ICA: 2185",
    "Hidróxido de Calcio - COMP: CaO 65.3 – MgO 2.3 /R. ICA: 9075",
    "Calferquim - COMP: 17 – 6 – 18 – MgO 2 /R. ICA: 5060",
    "Pentax - COMP: 0 – 3 – 0 – CaO 31 – MgO 15 – S 3 – Si 15 /R. ICA: 11504"
];

const ENMIENDAS = [
    "Silival CA X50 KL",
    "Tierra de Diatomea",
    "Calidra",
    "Silical Mg",
    "NEUTRON",
    "Ácido bórico",
    "Rapical",
    "Cal Dolomita",
    "Pentax",
    "Enmienda triple 30"
];

const UNIDADES_MEDIDA = ["cc/L", "g/L", "L/Caneca", "Kg/Caneca", "g/Planta"];

const RecomendacionForm: React.FC<RecomendacionFormFCCProps> = ({
    recomendacion,
    onSubmit,
    onCancel,
    lotes,
    docentes,
    currentUser,
    esEdicion = false
}) => {
    // ========== Datos básicos ==========
    const [formData, setFormData] = useState({
        titulo: recomendacion?.titulo || '',
        descripcion: recomendacion?.descripcion || '',
        tipo: recomendacion?.tipo || 'Recomendación FCC',
        estado: recomendacion?.estado || 'pendiente',
        docente_id: recomendacion?.docente_id || (currentUser?.rol_id === 2 || currentUser?.rol_id === 5 ? currentUser.id : ''),
        lote_id: recomendacion?.lote_id || '',
        diagnostico_id: recomendacion?.diagnostico_id || '',
        semana_anio: '',
        actividades_generales: [] as string[],
        otra_actividad: '',
        // Aplicación fitosanitaria
        aplicacion_fitosanitaria: {
            activa: false,
            tipo_plaga: '',
            enfermedad: {
                agente_causal: '',
                enfermedad_seleccionada: '',
                tipo_aplicacion: '',
                recomendar_aplicacion: false,
                otro_enfermedad: ''
            },
            artropodo: {
                tipo_artropodo: '',
                artropodos_seleccionados: [] as string[],
                tipo_aplicacion: '',
                recomendar_aplicacion: false,
                otro_artropodo: ''
            }
        },
        // Aplicación nutricional
        aplicacion_nutricional: {
            activa: false,
            tipo_aplicacion: '',
            motivo: '',
            productos: [] as string[]
        },
        // Manejo de arvenses
        manejo_arvenses: {
            tipo: '',
            quimico: {
                instruccion: '',
                tipo_aplicacion: '',
                recomendar_aplicacion: false,
                productos: [] as string[]
            },
            mecanico: {
                instruccion: '',
                herramienta: '',
                otra_herramienta: ''
            }
        },
        // Cosecha y saneamiento
        cosecha_saneamiento: {
            producto: '',
            tipo_cosecha: '',
            cosecha_venta: {
                actividades: [] as string[],
                observaciones: ''
            },
            saneamiento: {
                actividades: [] as string[],
                observaciones: ''
            }
        },
        // Podas
        podas: {
            tipo: '',
            observaciones: ''
        },
        // Siembra
        siembra: {
            distancia_plantas: '',
            distancia_surcos: '',
            numero_plantas: ''
        },
        // Dosis final
        dosis: '',
        unidad_medida: ''
    });

    const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
    const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(false);
    const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<any[]>([]);

    // Estados para evidencias
    const [archivos, setArchivos] = useState<File[]>([]);
    const [descripcionesEvidencias, setDescripcionesEvidencias] = useState<string[]>([]);
    const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);

    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;

    // Cargar diagnósticos al seleccionar lote
    useEffect(() => {
        const cargarDiagnosticos = async () => {
            if (!formData.lote_id) {
                setDiagnosticos([]);
                setDiagnosticosFiltrados([]);
                return;
            }
            try {
                setLoadingDiagnosticos(true);
                const datosDiagnosticos = await diagnosticoService.obtenerDiagnosticos({
                    lote_id: parseInt(formData.lote_id as string)
                });
                const diagnosticosData = Array.isArray(datosDiagnosticos) ? datosDiagnosticos : (datosDiagnosticos?.items || []);
                const diagnosticosDisponibles = diagnosticosData.filter((d: any) =>
                    d.estado === 'abierto' || d.estado === 'en_revision'
                );
                setDiagnosticos(diagnosticosData);
                setDiagnosticosFiltrados(diagnosticosDisponibles);
            } catch (error) {
                console.error('Error cargando diagnósticos:', error);
            } finally {
                setLoadingDiagnosticos(false);
            }
        };
        cargarDiagnosticos();
    }, [formData.lote_id]);

    // Auto-asignar docente
    useEffect(() => {
        if (!esEdicion && esDocente && !formData.docente_id) {
            setFormData(prev => ({ ...prev, docente_id: currentUser.id }));
        }
    }, [currentUser, esEdicion, esDocente, formData.docente_id]);

    // Resetear si viene recomendación
    useEffect(() => {
        if (recomendacion) {
            setFormData(prev => ({ ...prev, ...recomendacion }));
        }
    }, [recomendacion]);

    // Handlers genéricos
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handlers para arrays (actividades generales)
    const handleActividadGeneral = (actividad: string, checked: boolean) => {
        setFormData(prev => {
            let nuevas = [...prev.actividades_generales];
            if (checked) nuevas.push(actividad);
            else nuevas = nuevas.filter(a => a !== actividad);
            return { ...prev, actividades_generales: nuevas };
        });
    };

    // Handlers para subsecciones
    const setAplicaFitosanitaria = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            aplicacion_fitosanitaria: { ...prev.aplicacion_fitosanitaria, activa: checked }
        }));
    };

    const setAplicaNutricional = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            aplicacion_nutricional: { ...prev.aplicacion_nutricional, activa: checked }
        }));
    };

    // Handlers para evidencias
    const agregarEvidencia = () => {
        setArchivos(prev => [...prev, null as any]);
        setDescripcionesEvidencias(prev => [...prev, '']);
        setTiposEvidencia(prev => [...prev, 'imagen']);
    };

    const eliminarEvidencia = (index: number) => {
        setArchivos(prev => prev.filter((_, i) => i !== index));
        setDescripcionesEvidencias(prev => prev.filter((_, i) => i !== index));
        setTiposEvidencia(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (index: number, file: File | null) => {
        const copia = [...archivos];
        copia[index] = file as any;
        setArchivos(copia);
    };

    const handleDescripcionChange = (index: number, value: string) => {
        const copia = [...descripcionesEvidencias];
        copia[index] = value;
        setDescripcionesEvidencias(copia);
    };

    const handleTipoEvidenciaChange = (index: number, value: string) => {
        const copia = [...tiposEvidencia];
        copia[index] = value;
        setTiposEvidencia(copia);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const evidencias = archivos.map((file, index) => ({
            file,
            descripcion: descripcionesEvidencias[index],
            tipo: tiposEvidencia[index]
        })).filter(ev => ev.file);

        const datosSubmit = {
            ...formData,
            lote_id: parseInt(formData.lote_id as string),
            docente_id: formData.docente_id ? parseInt(formData.docente_id as string) : undefined,
            diagnostico_id: formData.diagnostico_id ? parseInt(formData.diagnostico_id as string) : undefined,
            evidencias
        };
        onSubmit(datosSubmit);
    };

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                Recomendaciones Frutales de Clima Cálido (FCC)
            </h2>

            <form onSubmit={handleSubmit}>
                <div className="space-y-8">

                    {/* Semana del año */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semana del año *
                        </label>
                        <input
                            type="number"
                            name="semana_anio"
                            value={formData.semana_anio}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                            min="1"
                            max="53"
                            required
                        />
                    </div>

                    {/* Actividades Generales Recomendadas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Actividades Generales Recomendadas *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {["Aplicación fitosanitaria", "Aplicación nutricional", "Cosecha y saneamiento", "Manejo integrado de arvenses", "Podas", "Siembra", "Otra actividad"].map(act => (
                                <label key={act} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={act}
                                        checked={formData.actividades_generales.includes(act)}
                                        onChange={(e) => handleActividadGeneral(act, e.target.checked)}
                                        className="rounded"
                                    />
                                    <span>{act}</span>
                                </label>
                            ))}
                        </div>
                        {formData.actividades_generales.includes("Otra actividad") && (
                            <input
                                type="text"
                                placeholder="Describir actividad adicional a realizar"
                                value={formData.otra_actividad}
                                onChange={(e) => setFormData(prev => ({ ...prev, otra_actividad: e.target.value }))}
                                className="mt-2 w-full border rounded-lg p-3"
                            />
                        )}
                    </div>

                    {/* Lote a intervenir */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lote a intervenir *</label>
                        <select
                            name="lote_id"
                            value={formData.lote_id}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                            required
                        >
                            <option value="">Seleccionar lote</option>
                            {lotes.map(lote => (
                                <option key={lote.id} value={lote.id}>{lote.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Diagnóstico asociado (opcional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico asociado (opcional)</label>
                        {!formData.lote_id ? (
                            <div className="text-amber-600 bg-amber-50 p-3 rounded">Selecciona un lote primero</div>
                        ) : loadingDiagnosticos ? (
                            <div>Cargando...</div>
                        ) : diagnosticosFiltrados.length === 0 ? (
                            <div className="text-gray-500">No hay diagnósticos disponibles</div>
                        ) : (
                            <select
                                name="diagnostico_id"
                                value={formData.diagnostico_id}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-3"
                            >
                                <option value="">Seleccionar diagnóstico</option>
                                {diagnosticosFiltrados.map(d => (
                                    <option key={d.id} value={d.id}>{d.tipo} - {new Date(d.fecha_creacion).toLocaleDateString()}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Sección: Aplicación fitosanitaria (solo si se seleccionó) */}
                    {formData.actividades_generales.includes("Aplicación fitosanitaria") && (
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Aplicación fitosanitaria</h3>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.aplicacion_fitosanitaria.activa}
                                        onChange={(e) => setAplicaFitosanitaria(e.target.checked)}
                                    />
                                    <span>Incluir esta actividad</span>
                                </label>
                            </div>
                            {formData.aplicacion_fitosanitaria.activa && (
                                <>
                                    <div className="mb-4">
                                        <label className="block font-medium mb-1">Tipo de Plaga *</label>
                                        <select
                                            value={formData.aplicacion_fitosanitaria.tipo_plaga}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                aplicacion_fitosanitaria: { ...prev.aplicacion_fitosanitaria, tipo_plaga: e.target.value }
                                            }))}
                                            className="border rounded-lg p-3 w-full"
                                        >
                                            <option value="">Seleccionar</option>
                                            <option value="Enfermedades">Enfermedades</option>
                                            <option value="Artrópodos">Artrópodos</option>
                                        </select>
                                    </div>

                                    {/* Subsección Enfermedades */}
                                    {formData.aplicacion_fitosanitaria.tipo_plaga === "Enfermedades" && (
                                        <div className="bg-gray-50 p-4 rounded space-y-4">
                                            <div>
                                                <label className="block font-medium mb-1">Agente causal de la enfermedad *</label>
                                                <select
                                                    value={formData.aplicacion_fitosanitaria.enfermedad.agente_causal}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        aplicacion_fitosanitaria: {
                                                            ...prev.aplicacion_fitosanitaria,
                                                            enfermedad: { ...prev.aplicacion_fitosanitaria.enfermedad, agente_causal: e.target.value }
                                                        }
                                                    }))}
                                                    className="border rounded-lg p-3 w-full"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="Hongos">Hongos</option>
                                                    <option value="Bacterias">Bacterias</option>
                                                    <option value="Virus">Virus</option>
                                                    <option value="Oomicetos">Oomicetos</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">¿Cuál enfermedad va a controlar? *</label>
                                                <select
                                                    value={formData.aplicacion_fitosanitaria.enfermedad.enfermedad_seleccionada}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        aplicacion_fitosanitaria: {
                                                            ...prev.aplicacion_fitosanitaria,
                                                            enfermedad: { ...prev.aplicacion_fitosanitaria.enfermedad, enfermedad_seleccionada: e.target.value }
                                                        }
                                                    }))}
                                                    className="border rounded-lg p-3 w-full"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="Colletotrichum gloeosporioides - Antracnosis">Colletotrichum gloeosporioides - Antracnosis</option>
                                                    <option value="Mycosphaerella citri - Mancha grasienta">Mycosphaerella citri - Mancha grasienta</option>
                                                    <option value="Phytophthora spp. - Gomosis">Phytophthora spp. - Gomosis</option>
                                                    <option value="Virus de la Tristeza de los Cítricos (CTV)">Virus de la Tristeza de los Cítricos (CTV)</option>
                                                    <option value="Xylella fastidiosa - clorosis variegada">Xylella fastidiosa - clorosis variegada</option>
                                                    <option value="Huanglongbing - HLB">Huanglongbing - HLB</option>
                                                    <option value="Sin presencia de enfermedad">Sin presencia de enfermedad</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                                {formData.aplicacion_fitosanitaria.enfermedad.enfermedad_seleccionada === "Otro" && (
                                                    <input
                                                        type="text"
                                                        placeholder="Especifique otra enfermedad"
                                                        value={formData.aplicacion_fitosanitaria.enfermedad.otro_enfermedad}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            aplicacion_fitosanitaria: {
                                                                ...prev.aplicacion_fitosanitaria,
                                                                enfermedad: { ...prev.aplicacion_fitosanitaria.enfermedad, otro_enfermedad: e.target.value }
                                                            }
                                                        }))}
                                                        className="mt-2 w-full border rounded-lg p-3"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">Tipo de aplicación para Enfermedades *</label>
                                                <select
                                                    value={formData.aplicacion_fitosanitaria.enfermedad.tipo_aplicacion}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        aplicacion_fitosanitaria: {
                                                            ...prev.aplicacion_fitosanitaria,
                                                            enfermedad: { ...prev.aplicacion_fitosanitaria.enfermedad, tipo_aplicacion: e.target.value }
                                                        }
                                                    }))}
                                                    className="border rounded-lg p-3 w-full"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="Foliar">Foliar</option>
                                                    <option value="Drench">Drench</option>
                                                    <option value="Granulada">Granulada</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">¿Se va a recomendar aplicación de producto para Enfermedades? *</label>
                                                <div className="flex space-x-4">
                                                    <label className="flex items-center"><input type="radio" name="recomendar_enfermedad" value="Si" checked={formData.aplicacion_fitosanitaria.enfermedad.recomendar_aplicacion === true} onChange={() => setFormData(prev => ({ ...prev, aplicacion_fitosanitaria: { ...prev.aplicacion_fitosanitaria, enfermedad: { ...prev.aplicacion_fitosanitaria.enfermedad, recomendar_aplicacion: true } } }))} /> Sí</label>
                                                    <label className="flex items-center"><input type="radio" name="recomendar_enfermedad" value="No" checked={formData.aplicacion_fitosanitaria.enfermedad.recomendar_aplicacion === false} onChange={() => setFormData(prev => ({ ...prev, aplicacion_fitosanitaria: { ...prev.aplicacion_fitosanitaria, enfermedad: { ...prev.aplicacion_fitosanitaria.enfermedad, recomendar_aplicacion: false } } }))} /> No</label>
                                                </div>
                                            </div>
                                            {formData.aplicacion_fitosanitaria.enfermedad.recomendar_aplicacion && (
                                                <div>
                                                    <label className="block font-medium mb-1">FUNGICIDA a usar</label>
                                                    <select className="border rounded-lg p-3 w-full" onChange={(e) => console.log("Seleccionado fungicida:", e.target.value)}>
                                                        <option value="">Seleccionar fungicida</option>
                                                        {FUNGICIDAS.map((f, idx) => <option key={idx} value={f}>{f}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Subsección Artrópodos */}
                                    {formData.aplicacion_fitosanitaria.tipo_plaga === "Artrópodos" && (
                                        <div className="bg-gray-50 p-4 rounded space-y-4">
                                            <div>
                                                <label className="block font-medium mb-1">Tipo de artrópodo *</label>
                                                <select
                                                    value={formData.aplicacion_fitosanitaria.artropodo.tipo_artropodo}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        aplicacion_fitosanitaria: {
                                                            ...prev.aplicacion_fitosanitaria,
                                                            artropodo: { ...prev.aplicacion_fitosanitaria.artropodo, tipo_artropodo: e.target.value }
                                                        }
                                                    }))}
                                                    className="border rounded-lg p-3 w-full"
                                                >
                                                    <option value="">Seleccionar</option>
                                                    <option value="Insecto">Insecto</option>
                                                    <option value="Ácaro">Ácaro</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                                {formData.aplicacion_fitosanitaria.artropodo.tipo_artropodo === "Otro" && (
                                                    <input type="text" placeholder="Especifique" className="mt-2 w-full border rounded-lg p-3" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">¿Cuál o cuáles artrópodos va a controlar? *</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {["Compsus sp.", "Diaphorina citri", "Phyllocnistis sp.", "Toxoptera citricidus - Pulgón negro", "Phyllocoptruta sp.", "Polyphagotarsonemus sp.", "Hormiga Arriera", "Otro"].map(art => (
                                                        <label key={art} className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                value={art}
                                                                checked={formData.aplicacion_fitosanitaria.artropodo.artropodos_seleccionados.includes(art)}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setFormData(prev => {
                                                                        let lista = [...prev.aplicacion_fitosanitaria.artropodo.artropodos_seleccionados];
                                                                        if (checked) lista.push(art);
                                                                        else lista = lista.filter(a => a !== art);
                                                                        return { ...prev, aplicacion_fitosanitaria: { ...prev.aplicacion_fitosanitaria, artropodo: { ...prev.aplicacion_fitosanitaria.artropodo, artropodos_seleccionados: lista } } };
                                                                    });
                                                                }}
                                                            />
                                                            <span>{art}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {formData.aplicacion_fitosanitaria.artropodo.artropodos_seleccionados.includes("Otro") && (
                                                    <input type="text" placeholder="Especifique otro artrópodo" className="mt-2 w-full border rounded-lg p-3" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">Tipo de aplicación para Artrópodos *</label>
                                                <select className="border rounded-lg p-3 w-full">
                                                    <option>Foliar</option>
                                                    <option>Drench</option>
                                                    <option>Granulada</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-1">¿Se va a recomendar aplicación de producto para Artrópodos? *</label>
                                                <div className="flex space-x-4">
                                                    <label><input type="radio" name="recomendar_artropodo" /> Sí</label>
                                                    <label><input type="radio" name="recomendar_artropodo" /> No</label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Aplicación Nutricional */}
                    {formData.actividades_generales.includes("Aplicación nutricional") && (
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Aplicación Nutricional</h3>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" checked={formData.aplicacion_nutricional.activa} onChange={(e) => setAplicaNutricional(e.target.checked)} />
                                    <span>Incluir</span>
                                </label>
                            </div>
                            {formData.aplicacion_nutricional.activa && (
                                <>
                                    <div className="mb-4">
                                        <label className="block font-medium mb-1">¿Qué tipo de aplicación se requiere? *</label>
                                        <select className="border rounded-lg p-3 w-full">
                                            <option>Drench</option>
                                            <option>Fertilización Granulada</option>
                                            <option>Materia Orgánica</option>
                                            <option>Foliar</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block font-medium mb-1">Motivo de la recomendación *</label>
                                        <select className="border rounded-lg p-3 w-full">
                                            <option>Fertilizar</option>
                                            <option>Enmienda</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Productos (Foliar / Suelo / Enmienda)</label>
                                        <select className="border rounded-lg p-3 w-full">
                                            <option>Seleccionar producto</option>
                                            <optgroup label="Foliar">
                                                {FERTILIZANTES_FOLIARES.map((p, i) => <option key={i}>{p}</option>)}
                                            </optgroup>
                                            <optgroup label="Suelo">
                                                {FERTILIZANTES_SUELO.map((p, i) => <option key={i}>{p}</option>)}
                                            </optgroup>
                                            <optgroup label="Enmienda">
                                                {ENMIENDAS.map((e, i) => <option key={i}>{e}</option>)}
                                            </optgroup>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Manejo de Arvenses */}
                    {formData.actividades_generales.includes("Manejo integrado de arvenses") && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-2">Manejo de Arvenses</h3>
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Tipo de manejo *</label>
                                <div className="flex space-x-4">
                                    <label><input type="radio" name="tipo_manejo" value="Químico" /> Químico</label>
                                    <label><input type="radio" name="tipo_manejo" value="Mecánico" /> Mecánico</label>
                                </div>
                            </div>
                            {/* Químico */}
                            <div className="bg-gray-50 p-4 rounded space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Instrucción para la labor *</label>
                                    <select className="border rounded-lg p-3 w-full">
                                        <option>GENERAL</option>
                                        <option>PARCHEO</option>
                                        <option>NO APLICA</option>
                                        <option>PLATOS</option>
                                        <option>CALLES</option>
                                        <option>MIXTO</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Tipo de aplicación para Arvenses *</label>
                                    <select className="border rounded-lg p-3 w-full">
                                        <option>Foliar</option>
                                        <option>Drench</option>
                                        <option>Granulada</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">¿Se va a recomendar aplicación de producto para ARVENSES? *</label>
                                    <div className="flex space-x-4"><label><input type="radio" /> Sí</label><label><input type="radio" /> No</label></div>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">HERBICIDA a usar</label>
                                    <select className="border rounded-lg p-3 w-full">
                                        <option>Seleccionar herbicida</option>
                                        {HERBICIDAS.map((h, idx) => <option key={idx}>{h}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cosecha y saneamiento */}
                    {formData.actividades_generales.includes("Cosecha y saneamiento") && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-2">Cosecha y saneamiento</h3>
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Producto a cosechar *</label>
                                <select className="border rounded-lg p-3 w-full">
                                    <option>Naranja</option>
                                    <option>Mandarina</option>
                                    <option>Limón</option>
                                    <option>Maracuyá</option>
                                    <option>Aguacate</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Tipo de cosecha *</label>
                                <select className="border rounded-lg p-3 w-full">
                                    <option>Cosecha de fruta para la venta</option>
                                    <option>Saneamiento de producto enfermo</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Podas */}
                    {formData.actividades_generales.includes("Podas") && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-2">Podas</h3>
                            <div className="mb-4">
                                <label className="block font-medium mb-1">Tipo de poda *</label>
                                <select className="border rounded-lg p-3 w-full">
                                    <option>Formación - Poda a árbol joven para darle forma</option>
                                    <option>Mantenimiento - Poda a árbol adulto para facilitar el manejo</option>
                                    <option>Fitosanitaria - Poda de ramas enfermas de la planta</option>
                                    <option>Renovación - Poda de todas las ramas de la planta para que nazcan nuevas</option>
                                    <option>Realce - Poda para que las ramas no toquen el suelo</option>
                                    <option>Altura - Poda para disminuir la altura del árbol</option>
                                    <option>Deschuponada - Poda de chupones del patrón o de chupones entre las ramas</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Observaciones sobre la poda *</label>
                                <textarea className="w-full border rounded-lg p-3" rows={2}></textarea>
                            </div>
                        </div>
                    )}

                    {/* Siembra */}
                    {formData.actividades_generales.includes("Siembra") && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-2">Siembra</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><label className="block font-medium mb-1">Distancia entre plantas (m)</label><input type="number" step="0.1" className="border rounded-lg p-3 w-full" /></div>
                                <div><label className="block font-medium mb-1">Distancia entre surcos (m)</label><input type="number" step="0.1" className="border rounded-lg p-3 w-full" /></div>
                            </div>
                            <div><label className="block font-medium mb-1">Número de plantas a sembrar</label><input type="number" className="border rounded-lg p-3 w-full" /></div>
                        </div>
                    )}

                    {/* Dosis final */}
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-2">Recomendación de aplicación</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-medium mb-1">Dosis</label>
                                <input type="text" name="dosis" value={formData.dosis} onChange={handleChange} className="border rounded-lg p-3 w-full" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Unidad de medida</label>
                                <select name="unidad_medida" value={formData.unidad_medida} onChange={handleChange} className="border rounded-lg p-3 w-full">
                                    <option value="">Seleccionar</option>
                                    {UNIDADES_MEDIDA.map(u => <option key={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block font-medium mb-1">Descripción general de la recomendación</label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} className="w-full border rounded-lg p-3" placeholder="Detalles adicionales..."></textarea>
                        </div>
                    </div>

                    {/* Evidencias */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="font-medium text-gray-700">Evidencias</label>
                            <button type="button" onClick={agregarEvidencia} className="text-blue-600 text-sm">+ Agregar evidencia</button>
                        </div>
                        {archivos.map((_, idx) => (
                            <div key={idx} className="border rounded-lg p-4 mb-3">
                                <div className="flex justify-between"><span>Evidencia {idx+1}</span><button type="button" onClick={() => eliminarEvidencia(idx)} className="text-red-500">✕</button></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                    <select value={tiposEvidencia[idx]} onChange={(e) => handleTipoEvidenciaChange(idx, e.target.value)} className="border rounded p-2">
                                        <option value="imagen">Imagen</option>
                                        <option value="video">Video</option>
                                        <option value="documento">Documento</option>
                                    </select>
                                    <input type="text" placeholder="Descripción" value={descripcionesEvidencias[idx]} onChange={(e) => handleDescripcionChange(idx, e.target.value)} className="border rounded p-2" />
                                    <input type="file" onChange={(e) => handleFileChange(idx, e.target.files?.[0] || null)} className="border rounded p-2" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-5 border-t">
                        <button type="button" onClick={onCancel} className="px-5 py-2.5 border rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">Generar Recomendación</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default RecomendacionForm;