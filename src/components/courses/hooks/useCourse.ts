import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

type Course = MainTypes["Curso"]["type"];
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

export interface UseCourseReturn {
  course: Course | null;
  studySessions: SesionEstudio[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCourse = (courseId: number | string): UseCourseReturn => {
  const [course, setCourse] = useState<Course | null>(null);
  const [studySessions, setStudySessions] = useState<SesionEstudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load single course and its study sessions
  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the new query factories pattern
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
    } catch (err) {
      console.error("Error loading course:", err);
      setError("Error al cargar el curso. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Load course when courseId changes
  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  return {
    course,
    studySessions,
    loading,
    error,
    refetch: loadCourse,
  };
};
