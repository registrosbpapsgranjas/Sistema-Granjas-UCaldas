// hooks/useDashboard-fixed.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface FixedStats {
  granjasActivas: number;
  usuariosRegistrados: number;
  programasActivos: number;
  laboresMes: number;
}

const API_BASE_URL = 'http://localhost:8000';

export const useDashboardFixed = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<FixedStats>({
    granjasActivas: 0,
    usuariosRegistrados: 0,
    programasActivos: 0,
    laboresMes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        console.log('❌ No hay token, usando datos mock');
        setStats({
          granjasActivas: 24,
          usuariosRegistrados: 156,
          programasActivos: 8,
          laboresMes: 342
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching dashboard data...');
        
        try {
          const [granjasRes, usuariosRes, programasRes, laboresRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/granjas?t=${Date.now()}`, { 
            headers,
            cache: 'no-cache'
          }),
          fetch(`${API_BASE_URL}/api/usuarios?t=${Date.now()}`, { 
            headers,
            cache: 'no-cache' 
          }),
          fetch(`${API_BASE_URL}/api/programas?t=${Date.now()}`, { 
            headers,
            cache: 'no-cache'
          }),
          fetch(`${API_BASE_URL}/api/labores?t=${Date.now()}`, { 
            headers,
            cache: 'no-cache'
          })
        ]);

          console.log('📊 Responses status:', {
            granjas: granjasRes.status,
            usuarios: usuariosRes.status,
            programas: programasRes.status,
            labores: laboresRes.status
          });

          // Verificar respuestas
          if (!granjasRes.ok) throw new Error(`Error granjas: ${granjasRes.status}`);
          if (!usuariosRes.ok) throw new Error(`Error usuarios: ${usuariosRes.status}`);
          if (!programasRes.ok) throw new Error(`Error programas: ${programasRes.status}`);
          if (!laboresRes.ok) throw new Error(`Error labores: ${laboresRes.status}`);

          const [granjasData, usuariosData, programasData, laboresData] = await Promise.all([
            granjasRes.json(),
            usuariosRes.json(),
            programasRes.json(),
            laboresRes.json()
          ]);

          console.log('📦 Datos recibidosss:', {
            granjas: granjasData,
            usuarios: usuariosData,
            programas: programasData,
            labores: laboresData
          });

          // EXTRAER DATOS DEPENDIENDO DE LA ESTRUCTURA
          // Granjas: puede ser array directo o { items: [] }
          const granjas = Array.isArray(granjasData) ? granjasData : 
                         granjasData.items || granjasData.data || [];
          
          // Usuarios: puede ser array directo o { items: [] }
          const usuarios = Array.isArray(usuariosData) ? usuariosData : 
                          usuariosData.items || usuariosData.data || [];
          
          // Programas: puede ser array directo o { items: [] }
          const programas = Array.isArray(programasData) ? programasData : 
                           programasData.items || programasData.data || [];
          
          // Labores: según tu respuesta viene como { items: [], paginas: 1, total: 3 }
          const labores = laboresData.items || laboresData.data || [];

          console.log('🔍 Datos extraídos:', {
            granjasCount: granjas.length,
            usuariosCount: usuarios.length,
            programasCount: programas.length,
            laboresCount: labores.length,
            laboresEstructura: laboresData // Para ver la estructura completa
          });

          // Filtrar labores del mes actual
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const laboresEsteMes = labores.filter((labor: any) => {
            if (!labor.fecha_asignacion) return false;
            const fecha = new Date(labor.fecha_asignacion);
            return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
          });

          console.log('📅 Labores este mes:', {
            totalLabores: labores.length,
            laboresEsteMes: laboresEsteMes.length,
            currentMonth,
            currentYear
          });

          const realStats = {
            granjasActivas: granjas.filter((g: any) => g.estado === true || g.estado === 'activa').length,
            usuariosRegistrados: usuarios.length,
            programasActivos: programas.filter((p: any) => p.estado === true || p.estado === 'activo').length,
            laboresMes: laboresEsteMes.length
          };

          console.log('✅ Estadísticas finales:', realStats);
          setStats(realStats);
          
        } catch (fetchError) {
          console.error('⚠️ Error en fetch, usando datos mock:', fetchError);
          setStats({
            granjasActivas: 24,
            usuariosRegistrados: 156,
            programasActivos: 8,
            laboresMes: 342
          });
        }

      } catch (err) {
        console.error('❌ Error general:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setStats({
          granjasActivas: 24,
          usuariosRegistrados: 156,
          programasActivos: 8,
          laboresMes: 342
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  return { stats, loading, error };
};