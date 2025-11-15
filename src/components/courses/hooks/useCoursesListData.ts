import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { ModelFilter } from "@/utils/commons/queries/types";

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

// Define selection set for CursoCompartido query with Curso relation
const cursoCompartidoSelectionSet = [
  "usuarioId",
  "cursoId",
  "Curso.cursoId",
  "Curso.titulo",
  "Curso.descripcion",
  "Curso.imagen_portada",
  "Curso.duracion_estimada",
  "Curso.nivel_dificultad",
  "Curso.estado",
  "Curso.progreso_estimado",
  "Curso.playlistId",
  "Curso.playlistTitle",
  "Curso.playlistDescription",
  "Curso.playlistThumbnail",
  "Curso.playlistChannelTitle",
  "Curso.playlistChannelId",
  "Curso.playlistPublishedAt",
  "Curso.playlistItemCount",
  "Curso.usuarioId",
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

// Type for CursoCompartido item with Curso relation
type CursoCompartidoWithCurso = {
  usuarioId: string;
  cursoId: string;
  Curso: CourseListItem | null;
};

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
 * Client-side filtering function for courses
 * Applies the same filters that would be applied on the backend
 */
function filterCourses(
  courses: CourseListItem[],
  params?: UseCoursesListDataParams
): CourseListItem[] {
  let filtered = courses;

  // Filter by estado (always required)
  filtered = filtered.filter((c) => c.estado === "activo");

  // Filter by nivel_dificultad
  if (params?.levelFilter && params.levelFilter !== "todos") {
    filtered = filtered.filter(
      (c) => c.nivel_dificultad === params.levelFilter
    );
  }

  // Filter by duration
  if (params?.durationFilter && params.durationFilter !== "todos") {
    filtered = filtered.filter((course) => {
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

  // Filter by search term
  if (params?.searchTerm && params.searchTerm.trim()) {
    const searchLower = params.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (course) =>
        course.titulo.toLowerCase().includes(searchLower) ||
        course.descripcion?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

/**
 * Hook for fetching courses list data (basic fields only, no relations)
 * Used for courses grid/list view where we only need basic course information
 * Supports filtering by search term, level, duration, and user
 * Fetches both directly owned courses and shared courses via CursoCompartido
 * Direct courses use backend filtering, shared courses use client-side filtering
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

      // Get query factories for both Curso and CursoCompartido
      const { Curso, CursoCompartido } = await getQueryFactories<
        Pick<MainTypes, "Curso" | "CursoCompartido">,
        "Curso" | "CursoCompartido"
      >({
        entities: ["Curso", "CursoCompartido"],
      });

      // Build filter conditions array for direct courses (backend filtering)
      const filterConditions: ModelFilter<Course>[] = [
        { estado: { eq: "activo" } },
      ];

      // Add user filter if provided
      if (params?.usuarioId) {
        filterConditions.push({ usuarioId: { eq: params.usuarioId } });
      }

      // Add level filter if provided and not "todos"
      if (params?.levelFilter && params.levelFilter !== "todos") {
        filterConditions.push({
          nivel_dificultad: {
            eq: params.levelFilter as "basico" | "intermedio" | "avanzado",
          },
        });
      }

      // Add duration filter if provided and not "todos"
      if (params?.durationFilter && params.durationFilter !== "todos") {
        switch (params.durationFilter) {
          case "corto":
            filterConditions.push({ duracion_estimada: { le: 30 } });
            break;
          case "medio":
            // Use ModelFilter's and to combine gt and le conditions
            filterConditions.push({
              and: [
                { duracion_estimada: { gt: 30 } },
                { duracion_estimada: { le: 120 } },
              ],
            });
            break;
          case "largo":
            filterConditions.push({ duracion_estimada: { gt: 120 } });
            break;
        }
      }

      // Add search filter if provided and not empty
      if (params?.searchTerm && params.searchTerm.trim()) {
        const searchTerm = params.searchTerm.trim();
        filterConditions.push({
          or: [
            { titulo: { contains: searchTerm } },
            { descripcion: { contains: searchTerm } },
          ],
        });
      }

      // Combine all filters with AND logic
      const combinedFilter: ModelFilter<Course> =
        filterConditions.length === 1
          ? filterConditions[0]
          : { and: filterConditions };

      // Execute both queries in parallel
      const [directCoursesRes, sharedCoursesRes] = await Promise.allSettled([
        // Query directly owned courses with full backend filtering
        Curso.list({
          filter: combinedFilter,
          followNextToken: true,
          maxPages: 10,
          selectionSet: coursesListSelectionSet,
        }),
        // Query shared courses filtered by usuarioId only (backend)
        params?.usuarioId
          ? CursoCompartido.list({
              filter: { usuarioId: { eq: params.usuarioId } },
              followNextToken: true,
              maxPages: 10,
              selectionSet: cursoCompartidoSelectionSet,
            })
          : Promise.resolve({ items: [] }),
      ]);

      // Process direct courses
      let directCourses: CourseListItem[] = [];
      if (directCoursesRes.status === "fulfilled") {
        directCourses =
          (directCoursesRes.value.items as unknown as CourseListItem[]) || [];
      } else {
        console.error("Error loading direct courses:", directCoursesRes.reason);
      }

      // Process shared courses
      let sharedCourses: CourseListItem[] = [];
      if (sharedCoursesRes.status === "fulfilled" && params?.usuarioId) {
        const sharedRes = sharedCoursesRes.value;
        // Extract Curso objects from CursoCompartido results
        const extractedCourses = (
          (sharedRes.items || []) as unknown as CursoCompartidoWithCurso[]
        )
          .filter((cc) => cc.Curso) // Filter out null Curso
          .map((cc) => {
            const curso = cc.Curso!; // Non-null assertion since we filtered above
            // Transform to CourseListItem format
            return {
              cursoId: curso.cursoId,
              titulo: curso.titulo,
              descripcion: curso.descripcion,
              imagen_portada: curso.imagen_portada,
              duracion_estimada: curso.duracion_estimada,
              nivel_dificultad: curso.nivel_dificultad,
              estado: curso.estado,
              progreso_estimado: curso.progreso_estimado,
              playlistId: curso.playlistId,
              playlistTitle: curso.playlistTitle,
              playlistDescription: curso.playlistDescription,
              playlistThumbnail: curso.playlistThumbnail,
              playlistChannelTitle: curso.playlistChannelTitle,
              playlistChannelId: curso.playlistChannelId,
              playlistPublishedAt: curso.playlistPublishedAt,
              playlistItemCount: curso.playlistItemCount,
              usuarioId: curso.usuarioId,
            } as CourseListItem;
          });

        // Apply client-side filtering to shared courses
        sharedCourses = filterCourses(extractedCourses, params);
      } else if (sharedCoursesRes.status === "rejected") {
        console.error("Error loading shared courses:", sharedCoursesRes.reason);
      }

      // Combine and deduplicate results
      const allCourses = [...directCourses, ...sharedCourses];
      const seenCourseIds = new Set<string>();
      const uniqueCourses: CourseListItem[] = [];

      for (const course of allCourses) {
        if (!seenCourseIds.has(course.cursoId)) {
          seenCourseIds.add(course.cursoId);
          uniqueCourses.push(course);
        }
      }

      setCourses(uniqueCourses);

      // Set error only if both queries failed
      if (
        directCoursesRes.status === "rejected" &&
        (sharedCoursesRes.status === "rejected" || !params?.usuarioId)
      ) {
        setError("Error al cargar los cursos. Por favor, intenta nuevamente.");
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Error al cargar los cursos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [
    params?.usuarioId,
    params?.levelFilter,
    params?.durationFilter,
    params?.searchTerm,
  ]);

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
