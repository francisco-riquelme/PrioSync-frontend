import { useState, useEffect } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

// Define selection set for Curso with nested Modulos and Lecciones
const cursoWithLessonsSelectionSet = [
  "cursoId",
  "titulo",
  "Modulos.moduloId",
  "Modulos.titulo",
  "Modulos.orden",
  "Modulos.Lecciones.leccionId",
  "Modulos.Lecciones.titulo",
  "Modulos.Lecciones.duracion_minutos",
  "Modulos.Lecciones.orden",
] as const;

// Explicit lightweight types to avoid complex union expansion from SelectionSet
type CursoLeccionLite = {
  readonly leccionId: string;
  readonly titulo: string;
  readonly duracion_minutos: number | null;
  readonly orden: number | null;
};

type CursoModuloLite = {
  readonly moduloId: string;
  readonly titulo: string;
  readonly orden: number | null;
  readonly Lecciones: readonly CursoLeccionLite[] | null;
};

type CursoWithLessonsLite = {
  readonly cursoId: string;
  readonly titulo: string;
  readonly Modulos: readonly CursoModuloLite[] | null;
};

// Extract nested types

export interface LessonOption {
  leccionId: string;
  titulo: string;
  duracion_minutos: number | null;
  moduloTitulo: string;
  moduloOrden: number | null;
  leccionOrden: number | null;
}

export const useCourseLessons = (cursoId?: string) => {
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cursoId) {
      setLessons([]);
      return;
    }

    const fetchLessons = async () => {
      setLoading(true);
      setError(null);

      try {
        const { Curso } = await getQueryFactories<
          Pick<MainTypes, "Curso">,
          "Curso"
        >({
          entities: ["Curso"],
        });

        // Fetch course with nested modules and lessons in ONE query
        const cursoRes = (await Curso.get({
          input: { cursoId },
          selectionSet: cursoWithLessonsSelectionSet,
        })) as unknown as CursoWithLessonsLite;

        if (!cursoRes) {
          setLessons([]);
          setLoading(false);
          return;
        }

        // Flatten lessons from all modules
        const allLessons: LessonOption[] = [];
        const modulos = cursoRes.Modulos || [];

        for (const modulo of modulos) {
          const lecciones = modulo.Lecciones || [];
          for (const leccion of lecciones) {
            allLessons.push({
              leccionId: leccion.leccionId,
              titulo: leccion.titulo,
              duracion_minutos: leccion.duracion_minutos,
              moduloTitulo: modulo.titulo,
              moduloOrden: modulo.orden,
              leccionOrden: leccion.orden,
            });
          }
        }

        // Sort by module order first, then lesson order
        allLessons.sort((a, b) => {
          const moduloCompare = (a.moduloOrden || 0) - (b.moduloOrden || 0);
          if (moduloCompare !== 0) return moduloCompare;
          return (a.leccionOrden || 0) - (b.leccionOrden || 0);
        });

        setLessons(allLessons);
      } catch (err) {
        console.error("Error fetching lessons:", err);
        setError("Error al cargar lecciones");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [cursoId]);

  return { lessons, loading, error };
};
