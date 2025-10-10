import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

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

// Use SelectionSet to infer proper types
type CourseWithRelations = SelectionSet<
  Course,
  typeof courseDetailSelectionSet
>;

// Extract nested types for easier access
export type ModuloWithLecciones = NonNullable<
  CourseWithRelations["Modulos"]
>[0];
export type LeccionFromModulo = NonNullable<
  ModuloWithLecciones["Lecciones"]
>[0];
export type MaterialFromCourse = NonNullable<
  CourseWithRelations["MaterialEstudio"]
>[0];
export type CuestionarioFromCourse = NonNullable<
  CourseWithRelations["Cuestionarios"]
>[0];

export interface UseCourseDetailDataParams {
  cursoId: string | number;
}

export interface UseCourseDetailDataReturn {
  course: CourseWithRelations | null;
  modulos: ModuloWithLecciones[];
  lecciones: LeccionFromModulo[];
  materiales: MaterialFromCourse[];
  quizzes: CuestionarioFromCourse[];
  loading: boolean;
  error: string | null;
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

  const [course, setCourse] = useState<CourseWithRelations | null>(null);
  const [modulos, setModulos] = useState<ModuloWithLecciones[]>([]);
  const [lecciones, setLecciones] = useState<LeccionFromModulo[]>([]);
  const [materiales, setMateriales] = useState<MaterialFromCourse[]>([]);
  const [quizzes, setQuizzes] = useState<CuestionarioFromCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourseDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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
      })) as unknown as CourseWithRelations;

      if (courseRes) {
        setCourse(courseRes);

        // Extract and sort modules
        const allModulos: ModuloWithLecciones[] = [];
        const allLecciones: LeccionFromModulo[] = [];

        if (courseRes.Modulos) {
          for (const modulo of courseRes.Modulos) {
            const moduloWithLecciones =
              modulo as unknown as ModuloWithLecciones;
            allModulos.push(moduloWithLecciones);

            if (moduloWithLecciones.Lecciones) {
              // Ordenar lecciones por orden dentro del módulo
              const leccionesOrdenadas = [...moduloWithLecciones.Lecciones].sort(
                (a, b) => (a.orden || 0) - (b.orden || 0)
              );
              allLecciones.push(
                ...(leccionesOrdenadas as unknown as LeccionFromModulo[])
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
        const allMateriales: MaterialFromCourse[] = [];
        const allQuizzes: CuestionarioFromCourse[] = [];

        if (courseRes.MaterialEstudio) {
          for (const material of courseRes.MaterialEstudio) {
            allMateriales.push(material as unknown as MaterialFromCourse);
          }
        }

        if (courseRes.Cuestionarios) {
          for (const quiz of courseRes.Cuestionarios) {
            allQuizzes.push(quiz as unknown as CuestionarioFromCourse);
          }
        }

        setMateriales(allMateriales);
        setQuizzes(allQuizzes);
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
  };
};

// Export types for convenience
export type { Course, Modulo, Leccion, MaterialEstudio, Cuestionario };
