import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import type { MainTypes } from "@/utils/api/schema";
import type { ModuloWithLecciones } from "./useCourseDetailData";

export interface UseProgresoModuloParams {
  modulo: ModuloWithLecciones;
  usuarioId: string;
}

export interface UseProgresoModuloReturn {
  progreso: number; // Porcentaje 0-100
  leccionesCompletadas: number;
  totalLecciones: number;
  loading: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Hook para calcular el progreso de un módulo específico
 * Calcula: (lecciones completadas en módulo / total lecciones en módulo) * 100
 */
export const useProgresoModulo = (
  params: UseProgresoModuloParams
): UseProgresoModuloReturn => {
  const { modulo, usuarioId } = params;

  const [leccionesCompletadas, setLeccionesCompletadas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalLecciones = modulo.Lecciones?.length || 0;

  // Calcular el progreso
  const calcularProgreso = useCallback(async () => {
    if (!usuarioId) {
      setLeccionesCompletadas(0);
      setLoading(false);
      return;
    }

    // No calcular si el módulo aún no está cargado o no tiene lecciones
    if (!modulo || !modulo.Lecciones || modulo.Lecciones.length === 0) {
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

      // Obtener IDs de todas las lecciones del módulo
      const leccionIds =
        modulo.Lecciones?.map((leccion) => leccion.leccionId) || [];

      if (leccionIds.length === 0) {
        setLeccionesCompletadas(0);
        setLoading(false);
        return;
      }

      // Obtener todos los progresos del usuario para las lecciones de este módulo
      const resultado = await ProgresoLeccion.list({
        filter: {
          and: [{ usuarioId: { eq: usuarioId } }, { completada: { eq: true } }],
        },
        selectionSet: ["usuarioId", "leccionId", "completada"],
      });

      // Contar cuántas lecciones de este módulo están completadas
      const leccionesCompletadasSet = new Set(
        resultado.items?.map((item) => item.leccionId) || []
      );

      const completadas = leccionIds.filter((id) =>
        leccionesCompletadasSet.has(id)
      ).length;

      setLeccionesCompletadas(completadas);
    } catch (err) {
      console.error("Error calculando progreso del módulo:", err);
      setError("Error al calcular el progreso del módulo");
      setLeccionesCompletadas(0);
    } finally {
      setLoading(false);
    }
  }, [modulo, usuarioId]);

  // Recargar progreso manualmente
  const recargar = useCallback(async () => {
    await calcularProgreso();
  }, [calcularProgreso]);

  // Calcular progreso solo al montar o cuando cambien módulo/usuario
  useEffect(() => {
    if (
      modulo &&
      modulo.Lecciones &&
      modulo.Lecciones.length > 0 &&
      usuarioId
    ) {
      calcularProgreso();
    }
  }, [modulo, usuarioId, calcularProgreso]);

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
