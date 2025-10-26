import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getQueryFactories } from '@/utils/commons/queries';
import type { MainTypes } from '@/utils/api/schema';

interface CursoConProgreso {
  cursoId: string;
  titulo: string;
  progreso: number; // 0-100
  leccionesCompletadas: number;
  totalLecciones: number;
}

interface UseCursosConProgresoReturn {
  cursos: CursoConProgreso[];
  loading: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Hook para obtener los cursos del usuario con su progreso calculado
 * Calcula el progreso basado en las lecciones completadas de todos los módulos
 */
export const useCursosConProgreso = (): UseCursosConProgresoReturn => {
  const { userData } = useUser();
  const [cursos, setCursos] = useState<CursoConProgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularProgresos = useCallback(async () => {
    if (!userData?.usuarioId || !userData?.Cursos) {
      setCursos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { Modulo, ProgresoLeccion } = await getQueryFactories<
        Pick<MainTypes, 'Modulo' | 'ProgresoLeccion'>,
        'Modulo' | 'ProgresoLeccion'
      >({
        entities: ['Modulo', 'ProgresoLeccion'],
      });

      // Obtener todos los progresos del usuario una sola vez
      const progresosUsuario = await ProgresoLeccion.list({
        filter: {
          and: [
            { usuarioId: { eq: userData.usuarioId } },
            { completada: { eq: true } }
          ],
        },
        selectionSet: ['usuarioId', 'leccionId', 'completada'],
      });

      const leccionesCompletadasSet = new Set(
        progresosUsuario.items?.map((item) => item.leccionId) || []
      );

      // Calcular progreso para cada curso
      const cursosConProgreso: CursoConProgreso[] = await Promise.all(
        userData.Cursos.map(async (curso) => {
          try {
            // Obtener módulos del curso con sus lecciones
            const modulosResult = await Modulo.list({
              filter: {
                cursoId: { eq: curso.cursoId }
              },
              selectionSet: [
                'moduloId',
                'cursoId',
                'titulo',
                'orden',
                'Lecciones.leccionId',
                'Lecciones.titulo',
                'Lecciones.orden',
              ],
            });

            const modulos = modulosResult.items || [];

            // Contar lecciones totales y completadas
            let totalLecciones = 0;
            let leccionesCompletadas = 0;

            for (const modulo of modulos) {
              const lecciones = modulo.Lecciones as unknown as Array<{ leccionId: string; titulo: string; orden: number }>;
              if (lecciones && Array.isArray(lecciones)) {
                for (const leccion of lecciones) {
                  totalLecciones++;
                  if (leccionesCompletadasSet.has(leccion.leccionId)) {
                    leccionesCompletadas++;
                  }
                }
              }
            }

            // Calcular porcentaje
            const progreso = totalLecciones > 0
              ? Math.round((leccionesCompletadas / totalLecciones) * 100)
              : 0;

            return {
              cursoId: curso.cursoId,
              titulo: curso.titulo,
              progreso,
              leccionesCompletadas,
              totalLecciones,
            };
          } catch (err) {
            console.error(`Error calculando progreso del curso ${curso.cursoId}:`, err);
            // En caso de error, retornar progreso 0
            return {
              cursoId: curso.cursoId,
              titulo: curso.titulo,
              progreso: 0,
              leccionesCompletadas: 0,
              totalLecciones: 0,
            };
          }
        })
      );

      setCursos(cursosConProgreso);
    } catch (err) {
      console.error('Error calculando progresos de cursos:', err);
      setError('Error al calcular el progreso de los cursos');
      setCursos([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.usuarioId, userData?.Cursos]);

  // Recargar progresos manualmente
  const recargar = useCallback(async () => {
    await calcularProgresos();
  }, [calcularProgresos]);

  // Calcular progresos al montar o cuando cambian los cursos del usuario
  useEffect(() => {
    if (userData?.usuarioId && userData?.Cursos) {
      calcularProgresos();
    }
  }, [userData?.usuarioId, userData?.Cursos, calcularProgresos]);

  return {
    cursos,
    loading,
    error,
    recargar,
  };
};
