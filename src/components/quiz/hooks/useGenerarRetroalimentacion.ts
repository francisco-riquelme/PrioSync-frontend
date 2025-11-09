import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { ResolversTypes } from '@/utils/api/resolverSchema';
import type { RecommendedLesson } from '@/types/quiz';

const client = generateClient<ResolversTypes>();

interface UseGenerarRetroalimentacionParams {
  onSuccess?: (feedback: string, recommendedLessons?: RecommendedLesson[]) => void;
  onError?: (error: string) => void;
}

interface GenerarRetroalimentacionResponse {
  feedback: string;
  recommendedLessons?: RecommendedLesson[];
  message?: string;
}

export const useGenerarRetroalimentacion = (params?: UseGenerarRetroalimentacionParams) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = useCallback(
    async (
      progresoCuestionarioId: string,
      cuestionarioId: string,
      usuarioId: string
    ): Promise<GenerarRetroalimentacionResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        console.info('[useGenerarRetroalimentacion] Generando retroalimentación...', {
          progresoCuestionarioId,
          cuestionarioId,
          usuarioId,
        });

        const response = await client.mutations.generarRetroalimentacionQuizResolver({
          progresoCuestionarioId,
          cuestionarioId,
          usuarioId,
        });

        console.log('[useGenerarRetroalimentacion] Respuesta completa:', response);
        console.log('[useGenerarRetroalimentacion] response.data:', response.data);
        console.log('[useGenerarRetroalimentacion] response.errors:', response.errors);

        if (!response.data) {
          console.error('[useGenerarRetroalimentacion] response.data es null o undefined');
          throw new Error('No se recibió respuesta del servidor');
        }

        if (!response.data.recomendaciones) {
          console.error('[useGenerarRetroalimentacion] response.data.recomendaciones es null o undefined');
          console.error('[useGenerarRetroalimentacion] Estructura de response.data:', Object.keys(response.data));
          throw new Error('La respuesta del servidor no contiene el campo "recomendaciones"');
        }

        // Parsear lecciones recomendadas si existen
        let recommendedLessons: RecommendedLesson[] | undefined;
        if (response.data.leccionesRecomendadas) {
          try {
            const parsed = JSON.parse(response.data.leccionesRecomendadas);
            if (Array.isArray(parsed)) {
              recommendedLessons = parsed;
              console.info('[useGenerarRetroalimentacion] Lecciones recomendadas parseadas:', recommendedLessons.length);
            }
          } catch (parseError) {
            console.warn('[useGenerarRetroalimentacion] Error al parsear lecciones recomendadas:', parseError);
          }
        }

        const result: GenerarRetroalimentacionResponse = {
          feedback: response.data.recomendaciones,
          recommendedLessons,
          message: response.data.message || undefined,
        };

        console.info('[useGenerarRetroalimentacion] Retroalimentación generada exitosamente:', result.feedback.substring(0, 100) + '...');

        if (params?.onSuccess) {
          params.onSuccess(result.feedback, result.recommendedLessons);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al generar retroalimentación';
        console.error('[useGenerarRetroalimentacion] Error:', errorMessage, err);
        setError(errorMessage);

        if (params?.onError) {
          params.onError(errorMessage);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  return {
    generar,
    loading,
    error,
  };
};
