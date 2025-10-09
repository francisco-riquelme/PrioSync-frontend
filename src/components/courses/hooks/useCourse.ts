import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

type Course = MainTypes["Curso"]["type"];
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

// Define selection sets as const arrays
const courseWithModulosSelectionSet = [
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
  "Modulos.moduloId",
  "Modulos.titulo",
  "Modulos.descripcion",
  "Modulos.duracion_estimada",
  "Modulos.orden",
  "Modulos.imagen_portada",
  "Modulos.progreso_estimado",
  "Modulos.Lecciones.leccionId",
  "Modulos.Lecciones.titulo",
  "Modulos.Lecciones.descripcion",
  "Modulos.Lecciones.duracion_minutos",
  "Modulos.Lecciones.tipo",
  "Modulos.Lecciones.url_contenido",
  "Modulos.Lecciones.completada",
  "Modulos.Lecciones.orden",
] as const;

const basicCourseSelectionSet = [
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
] as const;

// Use SelectionSet to infer proper types
type CourseWithModulos = SelectionSet<
  Course,
  typeof courseWithModulosSelectionSet
>;
type BasicCourse = SelectionSet<Course, typeof basicCourseSelectionSet>;

// Extract nested types for easier access
type ModuloWithLecciones = NonNullable<CourseWithModulos["Modulos"]>[0];
type LeccionFromModulo = NonNullable<ModuloWithLecciones["Lecciones"]>[0];

// Unified interface for both single and multiple course scenarios
export interface UseCourseReturn {
  // Single course scenario
  course: CourseWithModulos | null;
  studySessions: SesionEstudio[];
  modulos: ModuloWithLecciones[];
  lecciones: LeccionFromModulo[];
  // Multiple courses scenario
  courses: BasicCourse[];
  // Common properties
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCourseParams {
  courseId?: number | string;
}

/**
 * Unified hook for fetching courses
 * - If courseId is provided: fetches single course with its modules, lessons, and study sessions
 * - If courseId is not provided: fetches all active courses
 * Always uses full selectionSet for complete data
 */
export const useCourse = (
  params: UseCourseParams | number | string
): UseCourseReturn => {
  const [course, setCourse] = useState<CourseWithModulos | null>(null);
  const [courses, setCourses] = useState<BasicCourse[]>([]);
  const [studySessions, setStudySessions] = useState<SesionEstudio[]>([]);
  const [modulos, setModulos] = useState<ModuloWithLecciones[]>([]);
  const [lecciones, setLecciones] = useState<LeccionFromModulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize params to object format
  const normalizedParams: UseCourseParams =
    typeof params === "object" ? params : { courseId: params };

  const { courseId } = normalizedParams;

  // Unified load function that handles both scenarios
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (courseId) {
        // Single course scenario - always use full selectionSet
        const { Curso, SesionEstudio } = await getQueryFactories<
          MainTypes,
          "Curso" | "SesionEstudio"
        >({
          entities: ["Curso", "SesionEstudio"],
        });

        // Get single course by ID with full relations
        const courseRes = (await Curso.get({
          input: {
            cursoId: courseId.toString(),
          },
          selectionSet: courseWithModulosSelectionSet,
        })) as unknown as CourseWithModulos;

        // Get study sessions for this course
        const sessionsRes = await SesionEstudio.list({
          filter: {
            cursoId: { eq: courseId.toString() },
          },
          followNextToken: true,
          maxPages: 10,
        });

        if (courseRes) {
          setCourse(courseRes);
          setStudySessions(sessionsRes.items || []);

          // Always extract modules and lessons since we always fetch them
          const allModulos: ModuloWithLecciones[] = [];
          const allLecciones: LeccionFromModulo[] = [];

          if (courseRes.Modulos) {
            for (const modulo of courseRes.Modulos) {
              const moduloWithLecciones =
                modulo as unknown as ModuloWithLecciones;
              allModulos.push(moduloWithLecciones);

              if (moduloWithLecciones.Lecciones) {
                allLecciones.push(
                  ...(moduloWithLecciones.Lecciones as unknown as LeccionFromModulo[])
                );
              }
            }
          }

          // Sort modules and lessons by their order
          const sortedModulos = allModulos.sort(
            (a, b) => (a.orden || 0) - (b.orden || 0)
          );
          const sortedLecciones = allLecciones.sort(
            (a, b) => (a.orden || 0) - (b.orden || 0)
          );

          setModulos(sortedModulos);
          setLecciones(sortedLecciones);
        } else {
          setError("Curso no encontrado.");
        }
      } else {
        // Multiple courses scenario - use basic selectionSet for list
        const { Curso } = await getQueryFactories<MainTypes, "Curso">({
          entities: ["Curso"],
        });

        // Filter for active courses only
        const filter = { estado: { eq: "activo" } };

        const res = await Curso.list({
          filter,
          followNextToken: true,
          maxPages: 10,
          selectionSet: basicCourseSelectionSet,
        });

        setCourses((res.items as unknown as BasicCourse[]) || []);
      }
    } catch (err) {
      console.error("Error loading course(s):", err);
      setError(
        courseId
          ? "Error al cargar el curso. Por favor, intenta nuevamente."
          : "Error al cargar los cursos. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Load data when params change
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    course,
    courses,
    studySessions,
    modulos,
    lecciones,
    loading,
    error,
    refetch: loadData,
  };
};

// Export Course type for convenience
export type { Course, CourseWithModulos, BasicCourse };
