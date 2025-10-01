import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

type Course = MainTypes["Curso"]["type"];
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

// Unified interface for both single and multiple course scenarios
export interface UseCourseReturn {
  // Single course scenario
  course: Course | null;
  studySessions: SesionEstudio[];
  // Multiple courses scenario
  courses: Course[];
  // Common properties
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Unified hook for fetching courses
 * - If courseId is provided: fetches single course and its study sessions
 * - If courseId is not provided: fetches all active courses
 */
export const useCourse = (courseId?: number | string): UseCourseReturn => {
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studySessions, setStudySessions] = useState<SesionEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unified load function that handles both scenarios
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (courseId) {
        // Single course scenario
        const { Curso, SesionEstudio } = await getQueryFactories<
          MainTypes,
          "Curso" | "SesionEstudio"
        >({
          entities: ["Curso", "SesionEstudio"],
        });

        // Get single course by ID
        const courseRes = await Curso.get({
          input: {
            cursoId: courseId.toString(),
          },
        });

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
        } else {
          setError("Curso no encontrado.");
        }
      } else {
        // Multiple courses scenario
        const { Curso } = await getQueryFactories<MainTypes, "Curso">({
          entities: ["Curso"],
        });

        // Filter for active courses only
        const filter = { estado: { eq: "activo" } };

        const res = await Curso.list({
          filter,
          followNextToken: true,
          maxPages: 10,
        });

        setCourses(res.items || []);
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

  // Load data when courseId changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    course,
    courses,
    studySessions,
    loading,
    error,
    refetch: loadData,
  };
};

// Export Course type for convenience
export type { Course };
