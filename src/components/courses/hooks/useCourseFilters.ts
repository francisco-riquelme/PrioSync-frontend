import { useState } from "react";

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
}

export interface UseCourseFiltersReturn {
  filters: CourseFilters;
  actions: CourseFiltersActions;
}

export const useCourseFilters = (): UseCourseFiltersReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("todos");
  const [durationFilter, setDurationFilter] = useState("todos");

  const resetFilters = () => {
    setSearchTerm("");
    setLevelFilter("todos");
    setDurationFilter("todos");
  };

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
    },
  };
};
