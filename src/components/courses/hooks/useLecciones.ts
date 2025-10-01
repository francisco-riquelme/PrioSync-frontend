import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

// Import Leccion type from MainTypes
type Leccion = MainTypes["Leccion"]["type"];

export interface UseLeccionesReturn {
  lecciones: Leccion[];
  leccion: Leccion | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseLeccionesParams {
  cursoId?: number | string;
  leccionId?: string;
}

export const useLecciones = (
  params: UseLeccionesParams | number | string
): UseLeccionesReturn => {
  const [lecciones, setLecciones] = useState<Leccion[]>([]);
  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize params to object format
  const normalizedParams: UseLeccionesParams =
    typeof params === "object" ? params : { cursoId: params };

  const { cursoId, leccionId } = normalizedParams;

  // Load lessons or a single lesson
  const loadLecciones = useCallback(async () => {
    if (!cursoId && !leccionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the new query factories pattern
      const { Leccion } = await getQueryFactories<MainTypes, "Leccion">({
        entities: ["Leccion"],
      });

      // If leccionId is provided, fetch a single lesson
      if (leccionId) {
        const leccionRes = await Leccion.get({
          input: { leccionId },
        });

        if (leccionRes) {
          setLeccion(leccionRes);
          setLecciones([leccionRes]);
        } else {
          setError("Lección no encontrada.");
        }
      }
      // Otherwise, fetch all lessons for the course
      else if (cursoId) {
        const leccionesRes = await Leccion.list({
          filter: {
            cursoId: { eq: cursoId.toString() },
          },
          followNextToken: true,
          maxPages: 10,
        });

        // Sort by orden field
        const sortedLecciones = (leccionesRes.items || []).sort(
          (a, b) => (a.orden || 0) - (b.orden || 0)
        );

        setLecciones(sortedLecciones);
        setLeccion(null);
      }
    } catch (err) {
      console.error("Error loading lecciones:", err);
      setError("Error al cargar las lecciones. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [cursoId, leccionId]);

  // Load lessons when params change
  useEffect(() => {
    loadLecciones();
  }, [loadLecciones]);

  return {
    lecciones,
    leccion,
    loading,
    error,
    refetch: loadLecciones,
  };
};
