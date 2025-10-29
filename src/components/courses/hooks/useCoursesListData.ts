import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

type Course = MainTypes["Curso"]["type"];

// Define selection set for courses list (basic fields only, no relations)
const coursesListSelectionSet = [
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

// Lightweight type aligned with selection set
export type CourseListItem = {
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
};

export interface UseCoursesListDataReturn {
  courses: CourseListItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching courses list data (basic fields only, no relations)
 * Used for courses grid/list view where we only need basic course information
 * Auto-fetches on mount, filters for active courses, sorts by title
 */
export const useCoursesListData = (): UseCoursesListDataReturn => {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { Curso } = await getQueryFactories<
        Pick<MainTypes, "Curso">,
        "Curso"
      >({
        entities: ["Curso"],
      });

      // Filter for active courses only
      const filter = { estado: { eq: "activo" } };

      const res = await Curso.list({
        filter,
        followNextToken: true,
        maxPages: 10,
        selectionSet: coursesListSelectionSet,
      });

      setCourses(((res.items || []) as unknown as CourseListItem[]) || []);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Error al cargar los cursos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    courses,
    loading,
    error,
  };
};

// Export Course type for convenience
export type { Course };
