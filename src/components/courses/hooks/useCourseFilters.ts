import { useState, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

type Course = MainTypes["Curso"]["type"];

// Define selection set for filtered courses
const filteredCourseSelectionSet = [
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

export type FilteredCourse = SelectionSet<
  Course,
  typeof filteredCourseSelectionSet
>;

export interface CourseFilters {
  searchTerm: string;
  levelFilter: string;
  durationFilter: string;
}

export interface CourseFiltersActions {
  setSearchTerm: (term: string) => void;
  setLevelFilter: (level: string) => void;
  setDurationFilter: (duration: string) => void;
  resetFilters: () => void;
  applyFilters: () => Promise<FilteredCourse[]>;
}

export interface UseCourseFiltersReturn {
  filters: CourseFilters;
  actions: CourseFiltersActions;
  filteredCourses: FilteredCourse[];
  loading: boolean;
  error: string | null;
}

// Define proper filter condition types
type FilterCondition =
  | { estado: { eq: string } }
  | { nivel_dificultad: { eq: string } }
  | { duracion_estimada: { le: number } }
  | { duracion_estimada: { between: [number, number] } }
  | { duracion_estimada: { ge: number } }
  | {
      or: Array<
        | { titulo: { contains: string } }
        | { descripcion: { contains: string } }
        | { playlistTitle: { contains: string } }
      >;
    };

type CourseFilter = FilterCondition | { and: FilterCondition[] };

export const useCourseFilters = (): UseCourseFiltersReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("todos");
  const [durationFilter, setDurationFilter] = useState("todos");
  const [filteredCourses, setFilteredCourses] = useState<FilteredCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFilters = () => {
    setSearchTerm("");
    setLevelFilter("todos");
    setDurationFilter("todos");
  };

  const applyFilters = useCallback(async (): Promise<FilteredCourse[]> => {
    try {
      setLoading(true);
      setError(null);

      const { Curso } = await getQueryFactories<MainTypes, "Curso">({
        entities: ["Curso"],
      });

      // Build filter object based on current filter state with proper typing
      const filterConditions: FilterCondition[] = [];

      // Always filter for active courses
      filterConditions.push({ estado: { eq: "activo" } });

      // Apply level filter
      if (levelFilter !== "todos") {
        filterConditions.push({ nivel_dificultad: { eq: levelFilter } });
      }

      // Apply duration filter
      if (durationFilter !== "todos") {
        let durationCondition: FilterCondition | null = null;
        switch (durationFilter) {
          case "corto":
            durationCondition = { duracion_estimada: { le: 30 } };
            break;
          case "medio":
            durationCondition = {
              duracion_estimada: {
                between: [31, 120],
              },
            };
            break;
          case "largo":
            durationCondition = { duracion_estimada: { ge: 121 } };
            break;
        }
        if (durationCondition) {
          filterConditions.push(durationCondition);
        }
      }

      // Apply search term filter
      if (searchTerm.trim()) {
        filterConditions.push({
          or: [
            { titulo: { contains: searchTerm } },
            { descripcion: { contains: searchTerm } },
            { playlistTitle: { contains: searchTerm } },
          ],
        });
      }

      // Build the final filter with proper typing
      const filter: CourseFilter =
        filterConditions.length > 1
          ? { and: filterConditions }
          : filterConditions[0] || {};

      const res = await Curso.list({
        filter,
        followNextToken: true,
        maxPages: 10,
        selectionSet: filteredCourseSelectionSet,
      });

      const courses = (res.items as unknown as FilteredCourse[]) || [];
      setFilteredCourses(courses);
      return courses;
    } catch (err) {
      console.error("Error applying filters:", err);
      const errorMessage =
        "Error al aplicar los filtros. Por favor, intenta nuevamente.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, levelFilter, durationFilter]);

  return {
    filters: {
      searchTerm,
      levelFilter,
      durationFilter,
    },
    actions: {
      setSearchTerm,
      setLevelFilter,
      setDurationFilter,
      resetFilters,
      applyFilters,
    },
    filteredCourses,
    loading,
    error,
  };
};
