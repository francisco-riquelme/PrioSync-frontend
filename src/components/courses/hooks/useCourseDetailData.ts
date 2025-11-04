import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

type Course = MainTypes["Curso"]["type"];
type Modulo = MainTypes["Modulo"]["type"];
type Leccion = MainTypes["Leccion"]["type"];
type MaterialEstudio = MainTypes["MaterialEstudio"]["type"];
type Cuestionario = MainTypes["Cuestionario"]["type"];

// Define selection set for course detail with first-level relationships
const courseDetailSelectionSet = [
  // Course fields
  "cursoId",
  "titulo",
  "descripcion",
  "imagen_portada",
  "duracion_estimada",
  "nivel_dificultad",
  "estado",
  "progreso_estimado",
  "playlistId",
  "playlistTitle",
  "playlistDescription",
  "playlistThumbnail",
  "playlistChannelTitle",
  "playlistChannelId",
  "playlistPublishedAt",
  "playlistItemCount",
  "usuarioId",
  // Modulos with nested Lecciones
  "Modulos.moduloId",
  "Modulos.titulo",
  "Modulos.descripcion",
  "Modulos.duracion_estimada",
  "Modulos.orden",
  "Modulos.imagen_portada",
  "Modulos.progreso_estimado",
  "Modulos.cursoId",
  "Modulos.Lecciones.leccionId",
  "Modulos.Lecciones.titulo",
  "Modulos.Lecciones.descripcion",
  "Modulos.Lecciones.duracion_minutos",
  "Modulos.Lecciones.tipo",
  "Modulos.Lecciones.url_contenido",
  "Modulos.Lecciones.completada",
  "Modulos.Lecciones.orden",
  "Modulos.Lecciones.moduloId",
  // MaterialEstudio headers (not full content)
  "MaterialEstudio.materialEstudioId",
  "MaterialEstudio.titulo",
  "MaterialEstudio.tipo",
  "MaterialEstudio.url_contenido",
  "MaterialEstudio.modo_generacion",
  "MaterialEstudio.orden",
  "MaterialEstudio.descripcion",
  "MaterialEstudio.cuestionarioId",
  "MaterialEstudio.cursoId",
  "MaterialEstudio.leccionId",
  // Cuestionarios headers (not questions)
  "Cuestionarios.cuestionarioId",
  "Cuestionarios.titulo",
  "Cuestionarios.descripcion",
  "Cuestionarios.tipo",
  "Cuestionarios.puntos_maximos",
  "Cuestionarios.duracion_minutos",
  "Cuestionarios.intentos_permitidos",
  "Cuestionarios.preguntas_aleatorias",
  "Cuestionarios.porcentaje_aprobacion",
  "Cuestionarios.cursoId",
  "Cuestionarios.moduloId",
  "Cuestionarios.materialEstudioId",
] as const;

// Lightweight explicit interfaces matching the selection set
type LeccionLite = {
  readonly leccionId: string;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly duracion_minutos: number | null;
  readonly tipo: string | null;
  readonly url_contenido: string | null;
  readonly completada: boolean | null;
  readonly orden: number | null;
  readonly moduloId: string | null;
};

type ModuloWithLeccionesLite = {
  readonly moduloId: string;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly duracion_estimada: number | null;
  readonly orden: number | null;
  readonly imagen_portada: string | null;
  readonly progreso_estimado: number | null;
  readonly cursoId: string;
  readonly Lecciones: readonly LeccionLite[] | null;
};

type MaterialFromCourseLite = {
  readonly materialEstudioId: string;
  readonly titulo: string;
  readonly tipo: string | null;
  readonly url_contenido: string | null;
  readonly orden: number | null;
  readonly descripcion: string | null;
  readonly cuestionarioId: string | null;
  readonly cursoId: string | null;
  readonly leccionId: string | null;
};

type CuestionarioFromCourseLite = {
  readonly cuestionarioId: string;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly tipo: string | null;
  readonly puntos_maximos: number | null;
  readonly duracion_minutos: number | null;
  readonly intentos_permitidos: number | null;
  readonly preguntas_aleatorias: boolean | null;
  readonly porcentaje_aprobacion: number | null;
  readonly cursoId: string | null;
  readonly moduloId: string | null;
  readonly materialEstudioId: string | null;
};

type CourseWithRelationsLite = {
  readonly cursoId: string;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly imagen_portada: string | null;
  readonly duracion_estimada: number | null;
  readonly nivel_dificultad: "basico" | "intermedio" | "avanzado" | null;
  readonly estado: "activo" | "inactivo" | null;
  readonly progreso_estimado: number | null;
  readonly playlistId: string | null;
  readonly playlistTitle: string | null;
  readonly playlistDescription: string | null;
  readonly playlistThumbnail: string | null;
  readonly playlistChannelTitle: string | null;
  readonly playlistChannelId: string | null;
  readonly playlistPublishedAt: string | null;
  readonly playlistItemCount: number | null;
  readonly usuarioId: string;
  readonly Modulos: readonly ModuloWithLeccionesLite[] | null;
  readonly MaterialEstudio: readonly MaterialFromCourseLite[] | null;
  readonly Cuestionarios: readonly CuestionarioFromCourseLite[] | null;
};

// Extract nested types for easier access (alias to lite types)
export type ModuloWithLecciones = ModuloWithLeccionesLite;
export type LeccionFromModulo = LeccionLite;
export type MaterialFromCourse = MaterialFromCourseLite;
export type CuestionarioFromCourse = CuestionarioFromCourseLite;

export interface UseCourseDetailDataParams {
  cursoId: string | number;
}

export interface UseCourseDetailDataReturn {
  course: CourseWithRelationsLite | null;
  modulos: ModuloWithLeccionesLite[];
  lecciones: LeccionLite[];
  materiales: MaterialFromCourseLite[];
  quizzes: CuestionarioFromCourseLite[];
  loading: boolean;
  error: string | null;
  refreshCourseData: () => Promise<void>;
}

/**
 * Hook for fetching single course detail data with first-level relationships
 * Used for course detail view where we need course + modules + lessons + materials + quiz headers
 * Auto-fetches on mount, auto-sorts modules and lessons by orden field
 * Modules are sorted by orden (1, 2, 3...) and lessons within each module are also sorted by orden
 */
export const useCourseDetailData = (
  params: UseCourseDetailDataParams
): UseCourseDetailDataReturn => {
  const { cursoId } = params;

  const [course, setCourse] = useState<CourseWithRelationsLite | null>(null);
  const [modulos, setModulos] = useState<ModuloWithLeccionesLite[]>([]);
  const [lecciones, setLecciones] = useState<LeccionLite[]>([]);
  const [materiales, setMateriales] = useState<MaterialFromCourseLite[]>([]);
  const [quizzes, setQuizzes] = useState<CuestionarioFromCourseLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourseDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Refreshing course data...", cursoId);

      const { Curso } = await getQueryFactories<
        Pick<MainTypes, "Curso">,
        "Curso"
      >({
        entities: ["Curso"],
      });

      // Get single course by ID with full relations
      const courseRes = (await Curso.get({
        input: {
          cursoId: cursoId.toString(),
        },
        selectionSet: courseDetailSelectionSet,
      })) as unknown as CourseWithRelationsLite;

      if (courseRes) {
        setCourse(courseRes);

        // Extract and sort modules
        const allModulos: ModuloWithLeccionesLite[] = [];
        const allLecciones: LeccionLite[] = [];

        if (courseRes.Modulos) {
          for (const modulo of courseRes.Modulos) {
            const moduloWithLecciones =
              modulo as unknown as ModuloWithLeccionesLite;
            allModulos.push(moduloWithLecciones);

            if (moduloWithLecciones.Lecciones) {
              // Ordenar lecciones por orden dentro del módulo
              const leccionesOrdenadas = [
                ...moduloWithLecciones.Lecciones,
              ].sort((a, b) => (a.orden || 0) - (b.orden || 0));
              allLecciones.push(
                ...(leccionesOrdenadas as unknown as LeccionLite[])
              );
            }
          }
        }

        // Ordenar módulos por orden
        const modulosOrdenados = allModulos.sort(
          (a, b) => (a.orden || 0) - (b.orden || 0)
        );

        setModulos(modulosOrdenados);
        setLecciones(allLecciones);

        // Extract materials and quizzes
        const allMateriales: MaterialFromCourseLite[] = [];
        const allQuizzes: CuestionarioFromCourseLite[] = [];

        if (courseRes.MaterialEstudio) {
          for (const material of courseRes.MaterialEstudio) {
            allMateriales.push(material as unknown as MaterialFromCourseLite);
          }
        }

        if (courseRes.Cuestionarios) {
          for (const quiz of courseRes.Cuestionarios) {
            allQuizzes.push(quiz as unknown as CuestionarioFromCourseLite);
          }
        }

        console.log(
          "📋 useCourseDetailData - Raw Cuestionarios from API:",
          courseRes.Cuestionarios
        );
        console.log(
          "📋 useCourseDetailData - Processed allQuizzes:",
          allQuizzes
        );

        // Ordenar quizzes por el orden del módulo al que pertenecen (ascendente).
        // Si el módulo no está presente, se coloca al final (orden 0).
        const moduloOrdenMap = new Map<string, number>();
        for (const m of modulosOrdenados) {
          moduloOrdenMap.set(m.moduloId, m.orden || 0);
        }

        const quizzesOrdenados = allQuizzes.sort((a, b) => {
          const aModuloOrden = moduloOrdenMap.get(a.moduloId || "") ?? 0;
          const bModuloOrden = moduloOrdenMap.get(b.moduloId || "") ?? 0;
          return aModuloOrden - bModuloOrden;
        });

        console.log(
          "📋 useCourseDetailData - Final sorted quizzes:",
          quizzesOrdenados
        );

        setMateriales(allMateriales);
        setQuizzes(quizzesOrdenados);
      } else {
        setError("Curso no encontrado.");
      }
    } catch (err) {
      console.error("Error loading course detail:", err);
      setError("Error al cargar el curso. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  // Load course detail when cursoId changes
  useEffect(() => {
    loadCourseDetail();
  }, [loadCourseDetail]);

  return {
    course,
    modulos,
    lecciones,
    materiales,
    quizzes,
    loading,
    error,
    refreshCourseData: loadCourseDetail,
  };
};

// Export types for convenience
export type { Course, Modulo, Leccion, MaterialEstudio, Cuestionario };
