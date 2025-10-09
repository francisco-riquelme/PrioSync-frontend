import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

// Import types from MainTypes
type Curso = MainTypes["Curso"]["type"];
// type Modulo = MainTypes["Modulo"]["type"];
type Leccion = MainTypes["Leccion"]["type"];

// Define selection sets as const arrays
const leccionWithModuloSelectionSet = [
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
  "Modulo.Curso.cursoId",
  "Modulo.Curso.titulo",
  "Modulo.Curso.descripcion",
  "Modulo.Curso.imagen_portada",
  "Modulo.Curso.duracion_estimada",
  "Modulo.Curso.nivel_dificultad",
  "Modulo.Curso.estado",
  "Modulo.Curso.progreso_estimado",
] as const;

const cursoWithModulosSelectionSet = [
  "cursoId",
  "titulo",
  "descripcion",
  "imagen_portada",
  "duracion_estimada",
  "nivel_dificultad",
  "estado",
  "progreso_estimado",
  "Modulos.moduloId",
  "Modulos.titulo",
  "Modulos.descripcion",
  "Modulos.duracion_estimada",
  "Modulos.orden",
  "Modulos.imagen_portada",
  "Modulos.progreso_estimado",
  "Modulos.cursoId",
  "Modulos.Curso.cursoId",
  "Modulos.Curso.titulo",
  "Modulos.Curso.descripcion",
  "Modulos.Curso.imagen_portada",
  "Modulos.Curso.duracion_estimada",
  "Modulos.Curso.nivel_dificultad",
  "Modulos.Curso.estado",
  "Modulos.Curso.progreso_estimado",
  "Modulos.Lecciones.leccionId",
  "Modulos.Lecciones.titulo",
  "Modulos.Lecciones.descripcion",
  "Modulos.Lecciones.duracion_minutos",
  "Modulos.Lecciones.tipo",
  "Modulos.Lecciones.url_contenido",
  "Modulos.Lecciones.completada",
  "Modulos.Lecciones.orden",
] as const;

// Use SelectionSet to infer proper types
type LeccionWithModulo = SelectionSet<
  Leccion,
  typeof leccionWithModuloSelectionSet
>;
type CursoWithModulos = SelectionSet<
  Curso,
  typeof cursoWithModulosSelectionSet
>;

// Extract nested types for easier access
type ModuloWithLecciones = NonNullable<CursoWithModulos["Modulos"]>[0];
// type LeccionFromModulo = NonNullable<ModuloWithLecciones["Lecciones"]>[0];

export interface UseLeccionesReturn {
  lecciones: Leccion[];
  leccion: Leccion | null;
  curso: CursoWithModulos | null;
  modulos: ModuloWithLecciones[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseLeccionesParams {
  cursoId?: number | string;
  leccionId?: string;
}

/**
 * Hook for fetching lessons
 * - If leccionId is provided: fetches single lesson with its module and course
 * - If cursoId is provided: fetches all lessons for the course through modules
 * Always uses full selectionSet for complete data
 */
export const useLecciones = (
  params: UseLeccionesParams | number | string
): UseLeccionesReturn => {
  const [lecciones, setLecciones] = useState<Leccion[]>([]);
  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [curso, setCurso] = useState<CursoWithModulos | null>(null);
  const [modulos, setModulos] = useState<ModuloWithLecciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize params to object format
  const normalizedParams: UseLeccionesParams =
    typeof params === "object" ? params : { cursoId: params };

  const { cursoId, leccionId } = normalizedParams;

  // Load lessons through the new course -> module -> lesson structure
  const loadLecciones = useCallback(async () => {
    if (!cursoId && !leccionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the new query factories pattern
      const { Curso, Leccion } = await getQueryFactories<
        MainTypes,
        "Curso" | "Leccion"
      >({
        entities: ["Curso", "Leccion"],
      });

      // If leccionId is provided, fetch a single lesson with its module and course
      if (leccionId) {
        const leccionRes = (await Leccion.get({
          input: { leccionId },
          selectionSet: leccionWithModuloSelectionSet,
        })) as unknown as LeccionWithModulo;

        if (leccionRes) {
          setLeccion(leccionRes as unknown as Leccion);
          setLecciones([leccionRes as unknown as Leccion]);

          // Always extract curso and modulo from the lesson since we always fetch them
          if (leccionRes.Modulo) {
            const modulo = leccionRes.Modulo as unknown as ModuloWithLecciones;
            setModulos([modulo]);

            if (modulo.Curso) {
              setCurso(modulo.Curso as unknown as CursoWithModulos);
            }
          }
        } else {
          setError("Lección no encontrada.");
        }
      }
      // Otherwise, fetch all lessons for the course through modules
      else if (cursoId) {
        const cursoRes = (await Curso.get({
          input: { cursoId: cursoId.toString() },
          selectionSet: cursoWithModulosSelectionSet,
        })) as unknown as CursoWithModulos;

        if (cursoRes) {
          // Always set curso since we always fetch it
          setCurso(cursoRes);

          // Always extract all lessons from modules since we always fetch them
          const allLecciones: Leccion[] = [];
          const allModulos: ModuloWithLecciones[] = [];

          if (cursoRes.Modulos) {
            for (const modulo of cursoRes.Modulos) {
              const moduloWithLecciones =
                modulo as unknown as ModuloWithLecciones;
              allModulos.push(moduloWithLecciones);

              if (moduloWithLecciones.Lecciones) {
                allLecciones.push(
                  ...(moduloWithLecciones.Lecciones as unknown as Leccion[])
                );
              }
            }
          }

          // Sort modules and lessons by their order
          const sortedModulos = allModulos.sort(
            (a, b) => (a.orden || 0) - (b.orden || 0)
          );

          // Sort lessons by their order within modules
          const sortedLecciones = allLecciones.sort(
            (a, b) => (a.orden || 0) - (b.orden || 0)
          );

          setLecciones(sortedLecciones);
          setModulos(sortedModulos);
          setLeccion(null);
        } else {
          setError("Curso no encontrado.");
        }
      }
    } catch (err) {
      console.error("Error loading lecciones:", err);
      setError("Error al cargar las lecciones. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [cursoId, leccionId]);

  // Load lessons when params change
  useEffect(() => {
    loadLecciones();
  }, [loadLecciones]);

  return {
    lecciones,
    leccion,
    curso,
    modulos,
    loading,
    error,
    refetch: loadLecciones,
  };
};
