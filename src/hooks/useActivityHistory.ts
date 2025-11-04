import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

// Types from schema
type ProgresoLeccion = MainTypes["ProgresoLeccion"]["type"];
type Leccion = MainTypes["Leccion"]["type"];
type ProgresoCuestionario = MainTypes["ProgresoCuestionario"]["type"];
type Cuestionario = MainTypes["Cuestionario"]["type"];
type Curso = MainTypes["Curso"]["type"];

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

        type ProgresoLeccionWithRelations = SelectionSet<
          ProgresoLeccion,
          typeof selectionSetLeccion
        >;

        const leccionesCompletadas = await ProgresoLeccion.list({
          filter: {
            and: [{ usuarioId: { eq: usuarioId } }, { completada: { eq: true } }],
          },
          selectionSet: selectionSetLeccion,
          followNextToken: true,
          maxPages: 10,
        });

        for (const progreso of leccionesCompletadas.items || []) {
          const prog = progreso as unknown as ProgresoLeccionWithRelations;
          const leccion = prog.Leccion as unknown as LeccionWithModulo & {
            Modulo: ModuloWithCurso;
          };

          if (!leccion) continue;

          // Filtro por curso si se especifica
          if (cursoIdFiltro && leccion.Modulo?.Curso?.cursoId !== cursoIdFiltro) {
            continue;
          }

          allActivities.push({
            id: `${prog.leccionId}-${prog.fecha_completado}`,
            type: "lesson_completed",
            title: leccion.titulo,
            subtitle: `Lección completada${
              leccion.Modulo?.Curso ? ` - ${leccion.Modulo.Curso.titulo}` : ""
            }`,
            date: new Date(prog.fecha_completado || Date.now()).toLocaleDateString(
              "es-ES"
            ),
            fecha_completado: prog.fecha_completado || undefined,
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

        type ProgresoCuestionarioWithRelations = SelectionSet<
          ProgresoCuestionario,
          typeof selectionSetCuestionario
        >;

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
          const prog = progreso as unknown as ProgresoCuestionarioWithRelations;
          const cuestionario = prog.Cuestionario as unknown as CuestionarioWithCurso;

          if (!cuestionario) continue;

          // Filtro por curso si se especifica
          if (cursoIdFiltro && cuestionario.Curso?.cursoId !== cursoIdFiltro) {
            continue;
          }

          allActivities.push({
            id: `${prog.cuestionarioId}-${prog.fecha_completado}`,
            type: "quiz_completed",
            title: cuestionario.titulo,
            subtitle: `Cuestionario completado${
              cuestionario.Curso ? ` - ${cuestionario.Curso.titulo}` : ""
            }`,
            date: new Date(prog.fecha_completado || Date.now()).toLocaleDateString(
              "es-ES"
            ),
            fecha_completado: prog.fecha_completado || undefined,
            cursoId: cuestionario.Curso?.cursoId,
            cursoNombre: cuestionario.Curso?.titulo,
            puntaje: prog.puntaje_obtenido || 0,
            aprobado: prog.aprobado || false,
          });
        }
      }

      // Ordenar por fecha (más reciente primero)
      allActivities.sort((a, b) => {
        const dateA = new Date(a.fecha_completado || 0).getTime();
        const dateB = new Date(b.fecha_completado || 0).getTime();
        return dateB - dateA;
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

// Helper types for the nested relations
interface ModuloWithCurso {
  Curso: Curso | null;
}

interface LeccionWithModulo extends Leccion {
  Modulo?: ModuloWithCurso | null;
}

interface CuestionarioWithCurso extends Cuestionario {
  Curso: Curso | null;
}

