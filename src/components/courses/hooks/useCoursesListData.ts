import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

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

// Use SelectionSet to infer proper types
export type CourseListItem = SelectionSet<
  Course,
  typeof coursesListSelectionSet
>;

export interface UseCoursesListDataParams {
  searchTerm?: string;
  levelFilter?: string;
  durationFilter?: string;
  usuarioId?: string;
}

export interface UseCoursesListDataReturn {
  courses: CourseListItem[];
  loading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
}

/**
 * Hook for fetching courses list data (basic fields only, no relations)
 * Used for courses grid/list view where we only need basic course information
 * Supports filtering by search term, level, duration, and user
 * Applies filters on backend for better performance
 */
export const useCoursesListData = (
  params?: UseCoursesListDataParams
): UseCoursesListDataReturn => {
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

      // Build filter based on params
      const filterConditions: Record<string, { eq: string }> = {
        estado: { eq: "activo" },
      };

      // Add user filter if provided
      if (params?.usuarioId) {
        filterConditions.usuarioId = { eq: params.usuarioId };
      }

      // Add level filter
      if (params?.levelFilter && params.levelFilter !== "todos") {
        filterConditions.nivel_dificultad = { eq: params.levelFilter };
      }

      // Add duration filter - GraphQL doesn't support complex numeric ranges
      // so we'll need to handle this client-side or with multiple queries
      // For now, we'll fetch all and filter client-side for duration

      const res = await Curso.list({
        filter: filterConditions,
        followNextToken: true,
        maxPages: 10,
        selectionSet: coursesListSelectionSet,
      });

      let filteredCourses = (res.items as unknown as CourseListItem[]) || [];

      // Apply duration filter client-side (backend limitation)
      if (params?.durationFilter && params.durationFilter !== "todos") {
        filteredCourses = filteredCourses.filter((course) => {
          const duration = course.duracion_estimada || 0;
          switch (params.durationFilter) {
            case "corto":
              return duration <= 30;
            case "medio":
              return duration > 30 && duration <= 120;
            case "largo":
              return duration > 120;
            default:
              return true;
          }
        });
      }

      // Apply search filter client-side (GraphQL doesn't support contains)
      if (params?.searchTerm && params.searchTerm.trim()) {
        const searchLower = params.searchTerm.toLowerCase();
        filteredCourses = filteredCourses.filter(
          (course) =>
            course.titulo.toLowerCase().includes(searchLower) ||
            course.descripcion?.toLowerCase().includes(searchLower)
        );
      }

      setCourses(filteredCourses);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Error al cargar los cursos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [params?.usuarioId, params?.levelFilter, params?.durationFilter, params?.searchTerm]);

  // Load courses on mount and when params change
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    courses,
    loading,
    error,
    refreshCourses: loadCourses,
  };
};

// Export Course type for convenience
export type { Course };
