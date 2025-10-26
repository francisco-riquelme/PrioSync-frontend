/**
 * Hook para manejar las evaluaciones de cursos
 * Permite consultar, crear y actualizar evaluaciones
 */

import { useState, useEffect, useCallback } from 'react';
import { getQueryFactories } from '@/utils/commons/queries';
import { MainTypes } from '@/utils/api/schema';
import { EvaluacionFormData } from '@/types/evaluacion';

type EvaluacionCurso = MainTypes['EvaluacionCurso']['type'];

interface UseEvaluacionCursoParams {
  cursoId: string;
  usuarioId?: string;
}

interface UseEvaluacionCursoReturn {
  evaluacion: EvaluacionCurso | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  guardarEvaluacion: (data: EvaluacionFormData) => Promise<boolean>;
  recargar: () => Promise<void>;
}

export function useEvaluacionCurso({
  cursoId,
  usuarioId,
}: UseEvaluacionCursoParams): UseEvaluacionCursoReturn {
  const [evaluacion, setEvaluacion] = useState<EvaluacionCurso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Consultar evaluación existente
  const fetchEvaluacion = useCallback(async () => {
    if (!usuarioId || !cursoId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { EvaluacionCurso } = await getQueryFactories<
        Pick<MainTypes, 'EvaluacionCurso'>,
        'EvaluacionCurso'
      >({
        entities: ['EvaluacionCurso'],
      });

      const result = await EvaluacionCurso.list({
        filter: {
          and: [
            { usuarioId: { eq: usuarioId } },
            { cursoId: { eq: cursoId } },
          ],
        },
      });

      // Como la clave es compuesta (usuarioId, cursoId), solo puede haber 1 resultado
      const evaluacionExistente = result.items && result.items.length > 0 ? result.items[0] : null;
      setEvaluacion(evaluacionExistente);

      console.log('✅ Evaluación cargada:', evaluacionExistente);
    } catch (err) {
      console.error('❌ Error al consultar evaluación:', err);
      setError('Error al cargar la evaluación');
      setEvaluacion(null);
    } finally {
      setLoading(false);
    }
  }, [cursoId, usuarioId]);

  // Guardar o actualizar evaluación
  const guardarEvaluacion = useCallback(
    async (data: EvaluacionFormData): Promise<boolean> => {
      if (!usuarioId || !cursoId) {
        console.error('❌ Faltan datos: usuarioId o cursoId');
        return false;
      }

      try {
        setSaving(true);
        setError(null);

        const { EvaluacionCurso } = await getQueryFactories<
          Pick<MainTypes, 'EvaluacionCurso'>,
          'EvaluacionCurso'
        >({
          entities: ['EvaluacionCurso'],
        });

        const evaluacionData = {
          usuarioId,
          cursoId,
          calificacion: data.calificacion,
          comentario: data.comentario,
          fecha_evaluacion: new Date().toISOString(),
        };

        let result;

        if (evaluacion) {
          // Actualizar evaluación existente
          console.log('🔄 Actualizando evaluación existente...');
          result = await EvaluacionCurso.update({ input: evaluacionData });
        } else {
          // Crear nueva evaluación
          console.log('➕ Creando nueva evaluación...');
          result = await EvaluacionCurso.create({ input: evaluacionData });
        }

        console.log('✅ Evaluación guardada exitosamente:', result);
        
        // Actualizar estado local
        if (result) {
          setEvaluacion(result);
        }

        // Recargar datos
        await fetchEvaluacion();

        return true;
      } catch (err) {
        console.error('❌ Error al guardar evaluación:', err);
        setError('Error al guardar la evaluación');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [usuarioId, cursoId, evaluacion, fetchEvaluacion]
  );

  // Recargar evaluación
  const recargar = useCallback(async () => {
    await fetchEvaluacion();
  }, [fetchEvaluacion]);

  // Cargar evaluación al montar o cuando cambien los parámetros
  useEffect(() => {
    fetchEvaluacion();
  }, [fetchEvaluacion]);

  return {
    evaluacion,
    loading,
    error,
    saving,
    guardarEvaluacion,
    recargar,
  };
}
