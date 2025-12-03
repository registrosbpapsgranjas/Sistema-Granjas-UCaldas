  import { useState, useEffect } from 'react';
  import { DashboardStats, Granja, Programa, Labor } from '../types/dashboardTypes';
  import { useAuth } from './useAuth';

  export const useDashboard = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
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
          setLoading(false);
          return;
        }
        
        try {
          setLoading(true);
          setError(null);
          
          console.log('Fetching dashboard data...');
          
          // Fetch en paralelo
          const [granjasRes, usuariosRes, programasRes, laboresRes] = await Promise.all([
            fetch('/api/granjas', {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch('/api/usuarios', {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch('/api/programas', {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch('/api/labores', {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          ]);

          console.log('Responses received:', {
            granjas: granjasRes.status,
            usuarios: usuariosRes.status,
            programas: programasRes.status,
            labores: laboresRes.status
          });

          // Verificar si las respuestas son OK
          if (!granjasRes.ok) throw new Error(`Error granjas: ${granjasRes.status}`);
          if (!usuariosRes.ok) throw new Error(`Error usuarios: ${usuariosRes.status}`);
          if (!programasRes.ok) throw new Error(`Error programas: ${programasRes.status}`);
          if (!laboresRes.ok) throw new Error(`Error labores: ${laboresRes.status}`);

          const granjas: Granja[] = await granjasRes.json();
          const usuarios: any[] = await usuariosRes.json();
          const programas: Programa[] = await programasRes.json();
          const labores: Labor[] = await laboresRes.json();

          console.log('Data parsed:', {
            granjas: granjas.length,
            usuarios: usuarios.length,
            programas: programas.length,
            labores: labores.length
          });

          // Filtrar y contar
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          const laboresEsteMes = labores.filter(labor => {
            const fecha = new Date(labor.fecha_asignacion);
            return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
          });

          const newStats: DashboardStats = {
            granjasActivas: granjas.filter(g => g.estado).length,
            usuariosRegistrados: usuarios.length,
            programasActivos: programas.filter(p => p.estado).length,
            laboresMes: laboresEsteMes.length
          };

          console.log('Stats calculated:', newStats);
          setStats(newStats);

        } catch (err) {
          console.error('Error in useDashboard:', err);
          setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, [token]);

    return { stats, loading, error };
  };