import { useState, useCallback, useEffect } from 'react';
import { getQueryFactories } from '@/utils/commons/queries';
import type { MainTypes } from '@/utils/api/schema';

type ProgresoLeccion = MainTypes['ProgresoLeccion']['type'];

export interface UseProgresoLeccionParams {
  leccionId: string;
  usuarioId: string;
}

export interface UseProgresoLeccionReturn {
  isCompleted: boolean;
  loading: boolean;
  error: string | null;
  marcarCompletada: () => Promise<void>;
  recargar: () => Promise<void>;
}

/**
 * Hook para manejar el progreso de una lección específica
 * Permite verificar si está completada y marcarla como completada
 */
export const useProgresoLeccion = (
  params: UseProgresoLeccionParams
): UseProgresoLeccionReturn => {
  const { leccionId, usuarioId } = params;

  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Cargar el progreso de la lección
  const cargarProgreso = useCallback(async () => {
    if (!usuarioId || !leccionId) {
      setIsCompleted(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { ProgresoLeccion } = await getQueryFactories<
        Pick<MainTypes, 'ProgresoLeccion'>,
        'ProgresoLeccion'
      >({
        entities: ['ProgresoLeccion'],
      });

      // Usar list con filtro para evitar errores cuando no existe el registro
      const resultado = await ProgresoLeccion.list({
        filter: {
          and: [
            { usuarioId: { eq: usuarioId } },
            { leccionId: { eq: leccionId } }
          ]
        },
        selectionSet: [
          'usuarioId',
          'leccionId',
          'completada',
          'fecha_completado',
        ],
      });

      // Si encontramos un registro, verificar si está completada
      if (resultado.items && resultado.items.length > 0) {
        const progreso = resultado.items[0] as unknown as ProgresoLeccion;
        setIsCompleted(progreso.completada || false);
      } else {
        // No existe registro, la lección no está completada
        setIsCompleted(false);
      }
    } catch (err) {
      console.error('Error cargando progreso de lección:', err);
      setError('Error al cargar el progreso');
      setIsCompleted(false);
    } finally {
      setLoading(false);
    }
  }, [leccionId, usuarioId]);

  // Marcar lección como completada
  const marcarCompletada = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { ProgresoLeccion } = await getQueryFactories<
        Pick<MainTypes, 'ProgresoLeccion'>,
        'ProgresoLeccion'
      >({
        entities: ['ProgresoLeccion'],
      });

      // Verificar si ya existe el registro usando list en lugar de get
      const resultado = await ProgresoLeccion.list({
        filter: {
          and: [
            { usuarioId: { eq: usuarioId } },
            { leccionId: { eq: leccionId } }
          ]
        },
        selectionSet: [
          'usuarioId',
          'leccionId',
          'completada',
          'fecha_completado',
        ],
      });

      const progresoExistente = resultado.items && resultado.items.length > 0 
        ? (resultado.items[0] as unknown as ProgresoLeccion)
        : null;

      if (progresoExistente) {
        // Actualizar registro existente (si ya estaba completada, solo actualizamos la fecha)
        await ProgresoLeccion.update({
          input: {
            usuarioId,
            leccionId,
            completada: true,
            fecha_completado: new Date().toISOString(),
          },
          selectionSet: [
            'usuarioId',
            'leccionId',
            'completada',
            'fecha_completado',
          ],
        });
      } else {
        // Crear nuevo registro
        await ProgresoLeccion.create({
          input: {
            usuarioId,
            leccionId,
            completada: true,
            fecha_completado: new Date().toISOString(),
          },
          selectionSet: [
            'usuarioId',
            'leccionId',
            'completada',
            'fecha_completado',
          ],
        });
      }

      setIsCompleted(true);
    } catch (err) {
      console.error('Error marcando lección como completada:', err);
      setError('Error al marcar la lección como completada');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [leccionId, usuarioId]);

  // Recargar progreso manualmente
  const recargar = useCallback(async () => {
    await cargarProgreso();
  }, [cargarProgreso]);

  // Cargar progreso al montar el componente
  useEffect(() => {
    cargarProgreso();
  }, [cargarProgreso]);

  return {
    isCompleted,
    loading,
    error,
    marcarCompletada,
    recargar,
  };
};

