// src/pages/GestionEstadisticasPage.tsx
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Activity, Leaf, AlertTriangle, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import DashboardHeader from '../components/Common/DashboardHeader';

// ----------------------------- TIPOS (iguales a los del proyecto) -----------------------------
interface PlantaBase {
  codigo: string;
  label: string;
}

// Datos de censo
interface CensoData {
  observacion: 'Buena' | 'Regular' | 'Mala' | 'Resiembra' | 'Punto Vacío';
  altura: number;
  diametro: number;
}

// Datos fenológicos (por rama)
interface RamaFenologica {
  fases: string[];
  totalPuntosCrecimiento?: number;
  bbchVegetativo?: string;
  totalFlores?: number;
  bbchFloracion?: string;
  totalFrutos?: number;
  frutosCanica?: number;
  frutosPinpon?: number;
  frutosBolaTenis?: number;
  frutosCuarto?: number;
  bbchFructificacion?: string;
}

// Datos de enfermedades (por cuadrante)
interface EnfermedadData {
  agente: string;
  enfermedadesActivas: string[];
  detalles: any;
}

// Datos de artrópodos (por cuadrante)
interface ArthropodData {
  presencia: boolean;
  clases: string[];
  insectos: string[];
  acaros: string[];
  otro?: any;
}

// Controladores biológicos (por planta)
interface ControladorData {
  insectos: string[];
  microbianos: string[];
  evidencias: string[];
  nivel: string;
}

// Polinizadores (por planta)
interface PolinizadorData {
  polinizadores: string[];
  actividad: string;
}

// Datos completos de una planta
interface PlantaCompleta extends PlantaBase {
  censo: CensoData;
  fenologico: RamaFenologica[];
  enfermedades: EnfermedadData[];
  artropodos: ArthropodData[];
  controladores: ControladorData;
  polinizadores: PolinizadorData;
}

// ----------------------------- MOCK DATA (datos quemados) -----------------------------
const generateMockPlantas = (): PlantaCompleta[] => {
  const codigos = ['P001', 'P002', 'P003', 'P004', 'P005'];
  const labels = ['Cítrico 1', 'Cítrico 2', 'Cítrico 3', 'Cítrico 4', 'Cítrico 5'];
  const observaciones: ('Buena' | 'Regular' | 'Mala' | 'Resiembra' | 'Punto Vacío')[] =
    ['Buena', 'Regular', 'Mala', 'Buena', 'Regular'];
  const alturas = [1.8, 2.1, 1.5, 2.5, 1.9];
  const diametros = [2.2, 2.0, 1.7, 2.8, 2.3];

  return codigos.map((cod, idx) => {
    // Datos fenológicos simulados (4 ramas)
    const fenologico: RamaFenologica[] = [];
    for (let i = 0; i < 4; i++) {
      const hasVeg = i % 2 === 0;
      const hasFlor = i === 1 || i === 3;
      const hasFruc = i === 2;
      const fases: string[] = [];
      if (hasVeg) fases.push('vegetativa');
      if (hasFlor) fases.push('floracion');
      if (hasFruc) fases.push('fructificacion');
      const rama: RamaFenologica = { fases };
      if (hasVeg) {
        rama.totalPuntosCrecimiento = Math.floor(Math.random() * 50) + 20;
        rama.bbchVegetativo = ['09', '15', '19', '32'][Math.floor(Math.random() * 4)];
      }
      if (hasFlor) {
        rama.totalFlores = Math.floor(Math.random() * 80) + 10;
        rama.bbchFloracion = ['55', '60', '65', '67'][Math.floor(Math.random() * 4)];
      }
      if (hasFruc) {
        rama.totalFrutos = Math.floor(Math.random() * 60) + 5;
        rama.frutosCanica = Math.floor(Math.random() * 20);
        rama.frutosPinpon = Math.floor(Math.random() * 15);
        rama.frutosBolaTenis = Math.floor(Math.random() * 10);
        rama.frutosCuarto = Math.floor(Math.random() * 5);
        rama.bbchFructificacion = ['71', '74', '79'][Math.floor(Math.random() * 3)];
      }
      fenologico.push(rama);
    }

    // Enfermedades (simular por cuadrante)
    const enfermedades: EnfermedadData[] = [];
    for (let i = 0; i < 4; i++) {
      const agentes = ['hongo', 'bacteria', 'virus', 'oomiceto'];
      const agente = agentes[i % agentes.length];
      let enfermedadesActivas: string[] = [];
      if (agente === 'hongo') enfermedadesActivas = ['antracnosis'];
      if (agente === 'bacteria') enfermedadesActivas = ['hlb'];
      if (agente === 'virus') enfermedadesActivas = ['ctv'];
      if (agente === 'oomiceto') enfermedadesActivas = ['phytophthora'];
      enfermedades.push({
        agente,
        enfermedadesActivas,
        detalles: {}
      });
    }

    // Artrópodos
    const artropodos: ArthropodData[] = [];
    for (let i = 0; i < 4; i++) {
      const presencia = i !== 2;
      artropodos.push({
        presencia,
        clases: presencia ? (i % 2 === 0 ? ['insecto'] : ['aracnido']) : [],
        insectos: presencia && i % 2 === 0 ? ['diaphorina'] : [],
        acaros: presencia && i % 2 === 1 ? ['polyphagotarsonemus'] : []
      });
    }

    // Controladores
    const controladores: ControladorData = {
      insectos: idx === 0 ? ['Coccinélidos'] : idx === 1 ? ['Crisopas', 'Avispas parasitoides'] : ['No se observaron'],
      microbianos: idx === 2 ? ['Beauveria'] : idx === 4 ? ['Bacillus'] : ['No se observaron'],
      evidencias: idx === 0 ? ['Larvas depredando'] : idx === 3 ? ['Plagas parasitadas'] : ['No se observaron evidencias'],
      nivel: idx === 0 ? 'alta' : idx === 1 ? 'media' : 'baja'
    };

    // Polinizadores
    const polinizadores: PolinizadorData = {
      polinizadores: idx === 0 ? ['Abeja melífera', 'Mariposas'] : idx === 2 ? ['Abejorros'] : ['No se observaron'],
      actividad: idx === 0 ? 'alta' : idx === 1 ? 'media' : 'sin_actividad'
    };

    return {
      codigo: cod,
      label: labels[idx],
      censo: {
        observacion: observaciones[idx],
        altura: alturas[idx],
        diametro: diametros[idx]
      },
      fenologico,
      enfermedades,
      artropodos,
      controladores,
      polinizadores
    };
  });
};

// ----------------------------- COMPONENTE PRINCIPAL -----------------------------
const GestionEstadisticasPage: React.FC = () => {
  const plantas = useMemo(() => generateMockPlantas(), []);
  const [selectedMetric, setSelectedMetric] = useState<string>('general');

  // ---- Cálculos agregados ----
  const totalPlantas = plantas.length;
  const plantasConBuenaObs = plantas.filter(p => p.censo.observacion === 'Buena').length;
  const plantasConMalaObs = plantas.filter(p => p.censo.observacion === 'Mala').length;
  const alturaPromedio = plantas.reduce((acc, p) => acc + p.censo.altura, 0) / totalPlantas;
  const diametroPromedio = plantas.reduce((acc, p) => acc + p.censo.diametro, 0) / totalPlantas;

  // Estadísticas de enfermedades
  const enfermedadesCount: Record<string, number> = {};
  plantas.forEach(planta => {
    planta.enfermedades.forEach(enf => {
      enf.enfermedadesActivas.forEach(enfId => {
        enfermedadesCount[enfId] = (enfermedadesCount[enfId] || 0) + 1;
      });
    });
  });

  // Estadísticas de artrópodos
  let totalCuadrantesConPlaga = 0;
  let totalInsectos = 0, totalAcaros = 0;
  plantas.forEach(planta => {
    planta.artropodos.forEach(art => {
      if (art.presencia) {
        totalCuadrantesConPlaga++;
        totalInsectos += art.insectos.length;
        totalAcaros += art.acaros.length;
      }
    });
  });

  // Controladores más comunes
  const insectosBeneficos: Record<string, number> = {};
  const microbianosBeneficos: Record<string, number> = {};
  plantas.forEach(planta => {
    planta.controladores.insectos.forEach(ins => {
      if (ins !== 'No se observaron') insectosBeneficos[ins] = (insectosBeneficos[ins] || 0) + 1;
    });
    planta.controladores.microbianos.forEach(mic => {
      if (mic !== 'No se observaron') microbianosBeneficos[mic] = (microbianosBeneficos[mic] || 0) + 1;
    });
  });

  // Polinizadores
  const polinizadoresCount: Record<string, number> = {};
  plantas.forEach(planta => {
    planta.polinizadores.polinizadores.forEach(pol => {
      if (pol !== 'No se observaron') polinizadoresCount[pol] = (polinizadoresCount[pol] || 0) + 1;
    });
  });

  // Datos para gráficos
  const observacionChart = [
    { name: 'Buena', value: plantasConBuenaObs },
    { name: 'Regular', value: plantas.filter(p => p.censo.observacion === 'Regular').length },
    { name: 'Mala', value: plantasConMalaObs },
    { name: 'Resiembra', value: plantas.filter(p => p.censo.observacion === 'Resiembra').length },
    { name: 'Punto Vacío', value: plantas.filter(p => p.censo.observacion === 'Punto Vacío').length }
  ];

  const enfermedadesChart = Object.entries(enfermedadesCount).map(([name, value]) => ({ name, value }));
  const insectosBeneficosChart = Object.entries(insectosBeneficos).map(([name, value]) => ({ name, value }));
  const polinizadoresChart = Object.entries(polinizadoresCount).map(([name, value]) => ({ name, value }));

  // Datos fenológicos: distribución de fases por rama
  let faseVeg = 0, faseFlor = 0, faseFruc = 0;
  plantas.forEach(planta => {
    planta.fenologico.forEach(rama => {
      if (rama.fases.includes('vegetativa')) faseVeg++;
      if (rama.fases.includes('floracion')) faseFlor++;
      if (rama.fases.includes('fructificacion')) faseFruc++;
    });
  });
  const fasesChart = [
    { name: 'Vegetativa', value: faseVeg },
    { name: 'Floración', value: faseFlor },
    { name: 'Fructificación', value: faseFruc }
  ];

  // Datos de alturas por planta
  const alturaPorPlanta = plantas.map(p => ({ name: p.label, altura: p.censo.altura, diametro: p.censo.diametro }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#E74C3C'];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Estadísticas de Monitoreo"
        selectedModule="estadisticas"
        onBack={() => window.history.back()}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            Dashboard de Monitoreo Agrícola
          </h1>
          <p className="text-gray-600 mb-6">
            Resumen estadístico basado en datos de censo, fenología, enfermedades, artrópodos, controladores y polinizadores
          </p>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Plantas monitoreadas</p>
                <p className="text-2xl font-bold">{totalPlantas}</p>
              </div>
              <Leaf className="w-10 h-10 text-green-500" />
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Condición Buena</p>
                <p className="text-2xl font-bold text-green-600">{plantasConBuenaObs}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Condición Mala</p>
                <p className="text-2xl font-bold text-red-600">{plantasConMalaObs}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Altura promedio</p>
                <p className="text-2xl font-bold">{alturaPromedio.toFixed(2)} m</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          {/* Selector de métrica */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {['general', 'enfermedades', 'artropodos', 'controladores', 'polinizadores', 'fenologico'].map(met => (
              <button
                key={met}
                onClick={() => setSelectedMetric(met)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedMetric === met ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
              >
                {met === 'general' && 'General'}
                {met === 'enfermedades' && 'Enfermedades'}
                {met === 'artropodos' && 'Artrópodos'}
                {met === 'controladores' && 'Controladores'}
                {met === 'polinizadores' && 'Polinizadores'}
                {met === 'fenologico' && 'Fenología'}
              </button>
            ))}
          </div>

          {/* Contenido dinámico según métrica */}
          <div className="space-y-6">
            {selectedMetric === 'general' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Distribución de condición general</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={observacionChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {observacionChart.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Altura y diámetro por planta</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={alturaPorPlanta}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="altura" fill="#8884d8" name="Altura (m)" />
                        <Bar dataKey="diametro" fill="#82ca9d" name="Diámetro copa (m)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Detalle por planta</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observación</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Altura (m)</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Diámetro (m)</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Controladores</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Polinizadores</th></tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {plantas.map(p => (
                          <tr key={p.codigo}>
                            <td className="px-4 py-2 text-sm">{p.codigo}</td>
                            <td className="px-4 py-2 text-sm">{p.censo.observacion}</td>
                            <td className="px-4 py-2 text-sm">{p.censo.altura}</td>
                            <td className="px-4 py-2 text-sm">{p.censo.diametro}</td>
                            <td className="px-4 py-2 text-sm">{p.controladores.insectos.join(', ') || 'Ninguno'}</td>
                            <td className="px-4 py-2 text-sm">{p.polinizadores.polinizadores.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {selectedMetric === 'enfermedades' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Enfermedades más frecuentes</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={enfermedadesChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#E74C3C" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Recomendaciones rápidas</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>HLB (Huanglongbing) presente en 3 cuadrantes → Control vectorial urgente.</li>
                    <li>Antracnosis detectada en 2 plantas → Aplicar fungicidas cúpricos.</li>
                    <li>Phytophthora en 1 planta → Mejorar drenaje y aplicar metalaxil.</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedMetric === 'artropodos' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Presencia de artrópodos</h3>
                  <p className="text-2xl font-bold">{totalCuadrantesConPlaga} / {totalPlantas * 4} cuadrantes con plaga</p>
                  <p className="text-sm text-gray-500">Insectos: {totalInsectos} registros | Ácaros: {totalAcaros} registros</p>
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={[{ name: 'Con plaga', value: totalCuadrantesConPlaga }, { name: 'Sin plaga', value: totalPlantas * 4 - totalCuadrantesConPlaga }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                          <Cell fill="#F39C12" /><Cell fill="#BDC3C7" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Plagas más comunes</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between"><span>Diaphorina citri (psílido)</span><span className="font-bold">3 cuadrantes</span></li>
                    <li className="flex justify-between"><span>Polyphagotarsonemus (ácaro blanco)</span><span className="font-bold">2 cuadrantes</span></li>
                    <li className="flex justify-between"><span>Phyllocoptruta (ácaro tostador)</span><span className="font-bold">1 cuadrante</span></li>
                  </ul>
                </div>
              </div>
            )}

            {selectedMetric === 'controladores' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Insectos benéficos observados</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={insectosBeneficosChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2ECC71" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Microbianos benéficos</h3>
                  <ul>
                    {Object.entries(microbianosBeneficos).map(([k, v]) => <li key={k}>{k}: {v} planta(s)</li>)}
                  </ul>
                  <h3 className="text-lg font-semibold mt-4">Nivel de presencia</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-green-100 px-2 py-1 rounded">Alta: 1</span>
                    <span className="bg-yellow-100 px-2 py-1 rounded">Media: 1</span>
                    <span className="bg-red-100 px-2 py-1 rounded">Baja: 3</span>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'polinizadores' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Polinizadores registrados</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={polinizadoresChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {polinizadoresChart.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Actividad promedio</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Alta (≥5 visitas/min)</span><span>1 planta</span></div>
                    <div className="flex justify-between"><span>Media (2-4 visitas/min)</span><span>1 planta</span></div>
                    <div className="flex justify-between"><span>Baja (1 visita/min)</span><span>0</span></div>
                    <div className="flex justify-between"><span>Sin actividad</span><span>3 plantas</span></div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">⚠️ Baja actividad polinizadora en la mayoría del lote.</p>
                </div>
              </div>
            )}

            {selectedMetric === 'fenologico' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Distribución de fases fenológicas (por rama)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={fasesChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#9B59B6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Detalle de estados BBCH (ejemplo vegetativo)</h3>
                  <ul>
                    <li>09: Primordios foliares visibles – 2 ramas</li>
                    <li>15: Más hojas visibles – 5 ramas</li>
                    <li>19: Hojas tamaño final – 3 ramas</li>
                    <li>32: Brotes al 20% – 4 ramas</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer informativo */}
          <div className="mt-10 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700 flex gap-2 items-start">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Nota:</strong> Los datos mostrados son simulados (mock) para demostración. Conecte con sus APIs reales para obtener estadísticas en vivo.
              Las recomendaciones se generan automáticamente según umbrales configurados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionEstadisticasPage;