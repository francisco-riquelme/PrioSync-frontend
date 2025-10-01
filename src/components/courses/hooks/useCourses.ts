import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

export interface Course {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number; // en minutos
  nivel_dificultad: "basico" | "intermedio" | "avanzado";
  estado: "activo" | "inactivo";
}

export interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCourses = (): UseCoursesReturn => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load courses function
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new query factories pattern
      const { Curso } = await getQueryFactories<MainTypes, "Curso">({
        entities: ["Curso"],
      });

      // Filter for active courses only
      const filter = { estado: { eq: "activo" } };

      const res = await Curso.list({
        filter,
        followNextToken: true, // Get all results
        maxPages: 10, // Safety limit
      });

      // Transform the response to match the Course interface
      const coursesData: Course[] = res.items.map((curso: any) => ({
        id_curso: parseInt(curso.cursoId),
        titulo: curso.titulo,
        descripcion: curso.descripcion || "",
        imagen_portada:
          curso.imagen_portada ||
          "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format",
        duracion_estimada: curso.duracion_estimada || 0,
        nivel_dificultad: curso.nivel_dificultad || "basico",
        estado: curso.estado || "activo",
      }));

      setCourses(coursesData);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Error al cargar los cursos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    courses,
    loading,
    error,
    refetch: loadCourses,
  };
};
