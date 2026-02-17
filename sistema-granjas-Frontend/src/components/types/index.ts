// ---------- INTERFACES GLOBALES ----------

export interface CaracterizacionTemplate {
  campos_requeridos: string[];
  tipo_participante: string;
}

export interface Censo {
  campos_requeridos: string[];
}

export interface Fenologico {
  campos_requeridos: string[];
}

export interface Formulario {
  id: string;
  caracterizacion_template: CaracterizacionTemplate;
  censo: Censo;
  fenologico: Fenologico;
}

export interface PlantaBase {
  codigo: string;
  label: string;
}

export interface PlantaFenologico extends PlantaBase {
  fase: "vegetativa" | "floracion" | "fructificacion" | "";
}

export interface CensoDatosEnvio {
  lote: string;
  plantas: Array<{
    codigo: string;
    observacion: string;
    altura: number;
    diametro: number;
  }>;
}

export interface FenologicoDatosEnvio {
  lote: string;
  plantas: Array<{
    codigo: string;
    fase: string;
    totalHojas?: number;
    brotesActivos?: number;
    bbchVegetativo?: string;
    totalFlores?: number;
    botonesFlorales?: number;
    bbchFloracion?: string;
    totalFrutos?: number;
    frutosCanica?: number;
    frutosPinpon?: number;
    frutosBolaTenis?: number;
    frutosCuartoMaduracion?: number;
    bbchFructificacion?: string;
  }>;
}

// ... (código existente)

export interface ArtropodoDatosEnvio {
  clase: string; // "insecto" | "aracnido"
  tipo_insecto?: string;
  otro_insecto_nombre?: string;
  compsus_adultos?: string;
  compsus_dano_hojas?: string;
  compsus_fotos?: string;
  diaphorina_brotes?: string;
  diaphorina_estados?: string;
  diaphorina_fotos?: string;
  phyllocnistis_galerias?: string;
  phyllocnistis_nivel_dano?: string;
  phyllocnistis_fotos?: string;
  toxoptera_brotes?: string;
  toxoptera_mielecilla?: string;
  toxoptera_fotos?: string;
  hormiga_activos?: string;
  hormiga_ubicacion?: string;
  hormiga_fotos?: string;
  tipo_acaro?: string;
  otro_acaro_nombre?: string;
  acaro_phyllocoptruta_frutos?: string;
  acaro_phyllocoptruta_fotos?: string;
  acaro_polyphagotarsonemus_frutos?: string;
  acaro_polyphagotarsonemus_fotos?: string;
  otro_sintomas?: string;
  otro_clase?: string;
  otro_nombre?: string;
  otro_fotos?: string;
}

export interface DatosEnvio {
  test_id: string;
  caracterizacion_datos: Record<string, string>;
  censo_datos?: CensoDatosEnvio;
  fenologico_datos?: FenologicoDatosEnvio;
  artropodo_datos?: ArtropodoDatosEnvio; // <-- NUEVO
  fecha: string;
  fingerprint: string;
}

// Utilidad para opciones de lote
export interface LoteOption {
  value: string;
  label: string;
}

export const LOTES: LoteOption[] = [
  { value: "l1", label: "Lote 1. Naranja - Bodega - 45 Plantas" },
  { value: "l2", label: "Lote 2. Naranja- Guadual - 108 Plantas" },
  { value: "l3", label: "Lote 3. Naranja pequeña - 124 Plantas" },
  { value: "l4", label: "Lote 4. Mandarina - Paneles - 53 Plantas" },
  { value: "l5", label: "Lote 5. Naranja - Oficina - 127 Plantas" },
  { value: "l6", label: "Lote 6. Mandarina Adulta - 114 Plantas" },
  { value: "l7", label: "Lote 7. Aguacate - 30 Plantas" },
  { value: "l8", label: "Lote 8. Mandarina Joven - 164 Plantas" },
  { value: "l9", label: "Lote 9. Naranja Adulta - 216 Plantas" },
  { value: "l10", label: "Lote 10. Limón Joven - 125 Plantas" },
  { value: "l11", label: "Lote 11. Limón Adulto - 64 Plantas" },
  { value: "l12", label: "Lote 12. Renovación 5 Módulos" },
  { value: "l13", label: "Lote 13. Lote Swinglea glutinos - Cantidad de metros lineales" },
];