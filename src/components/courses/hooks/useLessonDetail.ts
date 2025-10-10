import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

type Leccion = MainTypes["Leccion"]["type"];
type Modulo = MainTypes["Modulo"]["type"];
type Curso = MainTypes["Curso"]["type"];

// Define selection set for lesson detail with relations
const lessonDetailSelectionSet = [
  "leccionId",
  "titulo",
  "descripcion",
  "duracion_minutos",
  "tipo",
  "url_contenido",
  "completada",
  "orden",
  "moduloId",
  "Modulo.moduloId",
  "Modulo.titulo",
  "Modulo.descripcion",
  "Modulo.duracion_estimada",
  "Modulo.orden",
  "Modulo.imagen_portada",
  "Modulo.progreso_estimado",
  "Modulo.cursoId",
  "Modulo.Lecciones.leccionId",
  "Modulo.Lecciones.titulo",
  "Modulo.Lecciones.orden",
  "Modulo.Lecciones.tipo",
  "Modulo.Lecciones.duracion_minutos",
  "Modulo.Curso.cursoId",
  "Modulo.Curso.titulo",
  "Modulo.Curso.descripcion",
  "Modulo.Curso.imagen_portada",
  "Modulo.Curso.duracion_estimada",
  "Modulo.Curso.nivel_dificultad",
  "Modulo.Curso.estado",
  "Modulo.Curso.progreso_estimado",
  "Modulo.Curso.Modulos.moduloId",
  "Modulo.Curso.Modulos.orden",
  "Modulo.Curso.Modulos.Lecciones.leccionId",
  "Modulo.Curso.Modulos.Lecciones.titulo",
  "Modulo.Curso.Modulos.Lecciones.orden",
] as const;

// Use SelectionSet to infer proper types
type LeccionWithRelations = SelectionSet<
  Leccion,
  typeof lessonDetailSelectionSet
>;

// Extract nested types for easier access
type ModuloFromLeccion = NonNullable<LeccionWithRelations["Modulo"]>;
type CursoFromLeccion = NonNullable<ModuloFromLeccion["Curso"]>;

export interface UseLessonDetailParams {
  leccionId: string;
}

export interface UseLessonDetailReturn {
  leccion: Leccion | null;
  modulo: ModuloFromLeccion | null;
  curso: CursoFromLeccion | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching single lesson detail with its module and course
 * Used for lesson detail view where we need lesson + module + course info
 */
export const useLessonDetail = (
  params: UseLessonDetailParams
): UseLessonDetailReturn => {
  const { leccionId } = params;

  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [modulo, setModulo] = useState<ModuloFromLeccion | null>(null);
  const [curso, setCurso] = useState<CursoFromLeccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLessonDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { Leccion } = await getQueryFactories<
        Pick<MainTypes, "Leccion">,
        "Leccion"
      >({
        entities: ["Leccion"],
      });

      // Get single lesson by ID with relations
      const leccionRes = (await Leccion.get({
        input: { leccionId },
        selectionSet: lessonDetailSelectionSet,
      })) as unknown as LeccionWithRelations;

      if (leccionRes) {
        setLeccion(leccionRes as unknown as Leccion);

        // Extract related data
        if (leccionRes.Modulo) {
          const moduloData = leccionRes.Modulo as unknown as ModuloFromLeccion;
          setModulo(moduloData);

          if (moduloData.Curso) {
            setCurso(moduloData.Curso as unknown as CursoFromLeccion);
          }
        }
      } else {
        setError("Lección no encontrada.");
      }
    } catch (err) {
      console.error("Error loading lesson detail:", err);
      setError("Error al cargar la lección. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [leccionId]);

  // Load lesson detail when leccionId changes
  useEffect(() => {
    loadLessonDetail();
  }, [loadLessonDetail]);

  return {
    leccion,
    modulo,
    curso,
    loading,
    error,
  };
};

// Export types for convenience
export type { Leccion, Modulo, Curso };
