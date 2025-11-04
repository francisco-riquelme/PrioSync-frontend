import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

// Combined activity interface
export interface Activity {
  id: string;
  type: "lesson_completed" | "quiz_completed";
  title: string;
  subtitle: string;
  date: string;
  fecha_completado?: string;
  cursoId?: string;
  cursoNombre?: string;
  puntaje?: number;
  aprobado?: boolean;
}

export interface UseActivityHistoryParams {
  usuarioId: string;
  tipoFiltro?: "all" | "lesson_completed" | "quiz_completed";
  cursoIdFiltro?: string;
}

export interface UseActivityHistoryReturn {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para obtener el historial de actividades del usuario desde el backend
 * Consolida datos de ProgresoLeccion, ProgresoCuestionario y otras fuentes
 */
export const useActivityHistory = (
  params: UseActivityHistoryParams
): UseActivityHistoryReturn => {
  const { usuarioId, tipoFiltro = "all", cursoIdFiltro } = params;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!usuarioId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const allActivities: Activity[] = [];

      // 1. Cargar lecciones completadas
      if (tipoFiltro === "all" || tipoFiltro === "lesson_completed") {
        const { ProgresoLeccion } = await getQueryFactories<
          Pick<MainTypes, "ProgresoLeccion">,
          "ProgresoLeccion"
        >({
          entities: ["ProgresoLeccion"],
        });

        const selectionSetLeccion = [
          "usuarioId",
          "leccionId",
          "completada",
          "fecha_completado",
          "Leccion.leccionId",
          "Leccion.titulo",
          "Leccion.descripcion",
          "Leccion.duracion_minutos",
          "Leccion.moduloId",
          "Leccion.Modulo.moduloId",
          "Leccion.Modulo.titulo",
          "Leccion.Modulo.cursoId",
          "Leccion.Modulo.Curso.cursoId",
          "Leccion.Modulo.Curso.titulo",
        ] as const;

        const leccionesCompletadas = await ProgresoLeccion.list({
          filter: {
            and: [{ usuarioId: { eq: usuarioId } }, { completada: { eq: true } }],
          },
          selectionSet: selectionSetLeccion,
          followNextToken: true,
          maxPages: 10,
        });

        for (const progreso of leccionesCompletadas.items || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prog = progreso as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const leccion = prog.Leccion as any;

          if (!leccion) continue;

          // Filtro por curso si se especifica
          if (cursoIdFiltro && leccion.Modulo?.Curso?.cursoId !== cursoIdFiltro) {
            continue;
          }

          // Manejar fecha_completado de manera consistente
          const fechaCompletado = prog.fecha_completado || null;
          
          // Generar ID único sin usar undefined
          const activityId = fechaCompletado 
            ? `${prog.leccionId}-${fechaCompletado}`
            : `${prog.leccionId}-${prog.usuarioId}`;

          allActivities.push({
            id: activityId,
            type: "lesson_completed",
            title: leccion.titulo,
            subtitle: `Lección completada${
              leccion.Modulo?.Curso ? ` - ${leccion.Modulo.Curso.titulo}` : ""
            }`,
            date: fechaCompletado 
              ? new Date(fechaCompletado).toLocaleDateString("es-ES")
              : "Fecha no disponible",
            fecha_completado: fechaCompletado || undefined,
            cursoId: leccion.Modulo?.Curso?.cursoId,
            cursoNombre: leccion.Modulo?.Curso?.titulo,
          });
        }
      }

      // 2. Cargar cuestionarios completados
      if (tipoFiltro === "all" || tipoFiltro === "quiz_completed") {
        const { ProgresoCuestionario } = await getQueryFactories<
          Pick<MainTypes, "ProgresoCuestionario">,
          "ProgresoCuestionario"
        >({
          entities: ["ProgresoCuestionario"],
        });

        const selectionSetCuestionario = [
          "progresoCuestionarioId",
          "usuarioId",
          "cuestionarioId",
          "estado",
          "puntaje_obtenido",
          "aprobado",
          "fecha_completado",
          "intento_numero",
          "Cuestionario.cuestionarioId",
          "Cuestionario.titulo",
          "Cuestionario.descripcion",
          "Cuestionario.tipo",
          "Cuestionario.cursoId",
          "Cuestionario.Curso.cursoId",
          "Cuestionario.Curso.titulo",
        ] as const;

        const cuestionariosCompletados = await ProgresoCuestionario.list({
          filter: {
            and: [
              { usuarioId: { eq: usuarioId } },
              { estado: { eq: "completado" } },
            ],
          },
          selectionSet: selectionSetCuestionario,
          followNextToken: true,
          maxPages: 10,
        });

        for (const progreso of cuestionariosCompletados.items || []) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prog = progreso as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cuestionario = prog.Cuestionario as any;

          if (!cuestionario) continue;

          // Filtro por curso si se especifica
          if (cursoIdFiltro && cuestionario.Curso?.cursoId !== cursoIdFiltro) {
            continue;
          }

          // Manejar fecha_completado de manera consistente
          const fechaCompletado = prog.fecha_completado || null;
          
          // Generar ID único usando intento_numero si existe, o usuarioId si no hay fecha
          const intentoNumero = prog.intento_numero || 1;
          const activityId = fechaCompletado
            ? `${prog.cuestionarioId}-${fechaCompletado}-${intentoNumero}`
            : `${prog.cuestionarioId}-${prog.usuarioId}-${intentoNumero}`;

          allActivities.push({
            id: activityId,
            type: "quiz_completed",
            title: cuestionario.titulo,
            subtitle: `Cuestionario completado${
              cuestionario.Curso ? ` - ${cuestionario.Curso.titulo}` : ""
            }`,
            date: fechaCompletado
              ? new Date(fechaCompletado).toLocaleDateString("es-ES")
              : "Fecha no disponible",
            fecha_completado: fechaCompletado || undefined,
            cursoId: cuestionario.Curso?.cursoId,
            cursoNombre: cuestionario.Curso?.titulo,
            puntaje: prog.puntaje_obtenido || 0,
            aprobado: prog.aprobado || false,
          });
        }
      }

      // Ordenar por fecha (más reciente primero)
      // Actividades sin fecha van al final
      allActivities.sort((a, b) => {
        // Si ambas tienen fecha, ordenar normalmente
        if (a.fecha_completado && b.fecha_completado) {
          const dateA = new Date(a.fecha_completado).getTime();
          const dateB = new Date(b.fecha_completado).getTime();
          return dateB - dateA;
        }
        // Si solo 'a' tiene fecha, va primero
        if (a.fecha_completado && !b.fecha_completado) {
          return -1;
        }
        // Si solo 'b' tiene fecha, va primero
        if (!a.fecha_completado && b.fecha_completado) {
          return 1;
        }
        // Si ninguna tiene fecha, mantener orden original (usar ID como desempate)
        return a.id.localeCompare(b.id);
      });

      setActivities(allActivities);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError("Error al cargar el historial de actividades");
    } finally {
      setLoading(false);
    }
  }, [usuarioId, tipoFiltro, cursoIdFiltro]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    activities,
    loading,
    error,
    refresh: loadActivities,
  };
};


