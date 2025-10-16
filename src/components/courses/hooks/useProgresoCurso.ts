import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import type { MainTypes } from "@/utils/api/schema";
import type { ModuloWithLecciones } from "./useCourseDetailData";

export interface UseProgresoCursoParams {
  modulos: ModuloWithLecciones[];
  usuarioId: string;
}

export interface UseProgresoCursoReturn {
  progreso: number; // Porcentaje 0-100
  leccionesCompletadas: number;
  totalLecciones: number;
  loading: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Hook para calcular el progreso total de un curso
 * Calcula: (total lecciones completadas / total lecciones del curso) * 100
 */
export const useProgresoCurso = (
  params: UseProgresoCursoParams
): UseProgresoCursoReturn => {
  const { modulos, usuarioId } = params;

  const [leccionesCompletadas, setLeccionesCompletadas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcular total de lecciones en todos los módulos
  const totalLecciones = modulos.reduce((total, modulo) => {
    return total + (modulo.Lecciones?.length || 0);
  }, 0);

  // Calcular el progreso del curso completo
  const calcularProgreso = useCallback(async () => {
    if (!usuarioId) {
      setLeccionesCompletadas(0);
      setLoading(false);
      return;
    }

    // No calcular si los módulos aún no están cargados
    if (!modulos || modulos.length === 0) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (totalLecciones === 0) {
        setLeccionesCompletadas(0);
        setLoading(false);
        return;
      }

      const { ProgresoLeccion } = await getQueryFactories<
        Pick<MainTypes, "ProgresoLeccion">,
        "ProgresoLeccion"
      >({
        entities: ["ProgresoLeccion"],
      });

      // Obtener IDs de todas las lecciones de todos los módulos
      const todasLasLeccionIds: string[] = [];
      for (const modulo of modulos) {
        if (modulo.Lecciones) {
          for (const leccion of modulo.Lecciones) {
            todasLasLeccionIds.push(leccion.leccionId);
          }
        }
      }

      if (todasLasLeccionIds.length === 0) {
        setLeccionesCompletadas(0);
        setLoading(false);
        return;
      }

      // Obtener todos los progresos completados del usuario
      const resultado = await ProgresoLeccion.list({
        filter: {
          and: [{ usuarioId: { eq: usuarioId } }, { completada: { eq: true } }],
        },
        selectionSet: ["usuarioId", "leccionId", "completada"],
      });

      // Contar cuántas lecciones del curso están completadas
      const leccionesCompletadasSet = new Set(
        resultado.items?.map((item) => item.leccionId) || []
      );

      const completadas = todasLasLeccionIds.filter((id) =>
        leccionesCompletadasSet.has(id)
      ).length;

      setLeccionesCompletadas(completadas);
    } catch (err) {
      console.error("Error calculando progreso del curso:", err);
      setError("Error al calcular el progreso del curso");
      setLeccionesCompletadas(0);
    } finally {
      setLoading(false);
    }
  }, [modulos, usuarioId, totalLecciones]);

  // Recargar progreso manualmente
  const recargar = useCallback(async () => {
    await calcularProgreso();
  }, [calcularProgreso]);

  // Calcular progreso solo al montar o cuando cambien módulos/usuario
  useEffect(() => {
    if (modulos.length > 0 && usuarioId) {
      calcularProgreso();
    }
  }, [modulos, usuarioId, calcularProgreso]);

  // Calcular porcentaje
  const progreso =
    totalLecciones > 0
      ? Math.round((leccionesCompletadas / totalLecciones) * 100)
      : 0;

  return {
    progreso,
    leccionesCompletadas,
    totalLecciones,
    loading,
    error,
    recargar,
  };
};
