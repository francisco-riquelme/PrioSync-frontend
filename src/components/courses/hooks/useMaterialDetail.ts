import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

type MaterialEstudio = MainTypes["MaterialEstudio"]["type"];
type Curso = MainTypes["Curso"]["type"];
type Leccion = MainTypes["Leccion"]["type"];

// Define selection set for material detail with relations
const materialDetailSelectionSet = [
  "materialEstudioId",
  "titulo",
  "tipo",
  "url_contenido",
  "orden",
  "descripcion",
  "cuestionarioId",
  "cursoId",
  "leccionId",
  "Curso.cursoId",
  "Curso.titulo",
  "Curso.descripcion",
  "Curso.imagen_portada",
  "Curso.duracion_estimada",
  "Curso.nivel_dificultad",
  "Curso.estado",
  "Curso.progreso_estimado",
  "Leccion.leccionId",
  "Leccion.titulo",
  "Leccion.descripcion",
  "Leccion.duracion_minutos",
  "Leccion.tipo",
  "Leccion.url_contenido",
  "Leccion.completada",
  "Leccion.orden",
  "Leccion.moduloId",
  "contenido_generado",
] as const;

// Define types for response data (doesn't extend complex Amplify types)
interface CursoFromMaterial {
  cursoId: string;
  titulo: string;
  descripcion?: string | null;
  imagen_portada?: string | null;
  duracion_estimada?: number | null;
  nivel_dificultad?: string | null;
  estado?: string | null;
  progreso_estimado?: number | null;
}

interface LeccionFromMaterial {
  leccionId: string;
  titulo: string;
  descripcion?: string | null;
  duracion_minutos?: number | null;
  tipo?: string | null;
  url_contenido: string;
  completada?: boolean | null;
  orden?: number | null;
  moduloId: string;
}

interface MaterialWithRelations {
  materialEstudioId: string;
  titulo: string;
  tipo?: string | null;
  url_contenido: string;
  orden?: number | null;
  descripcion?: string | null;
  cuestionarioId?: string | null;
  cursoId: string;
  leccionId?: string | null;
  Curso?: CursoFromMaterial | null;
  Leccion?: LeccionFromMaterial | null;
  contenido_generado?: string | null;
}

export interface UseMaterialDetailParams {
  materialId: string;
}

export interface UseMaterialDetailReturn {
  material: MaterialEstudio | null;
  curso: CursoFromMaterial | null;
  leccion: LeccionFromMaterial | null;
  loading: boolean;
  error: string | null;
  contenidoParsed?: unknown | null;
}

/**
 * Hook for fetching single material detail with its course and lesson
 * Used for material detail view where we need material + course + lesson info
 */
export const useMaterialDetail = (
  params: UseMaterialDetailParams
): UseMaterialDetailReturn => {
  const { materialId } = params;

  const [material, setMaterial] = useState<MaterialEstudio | null>(null);
  const [curso, setCurso] = useState<CursoFromMaterial | null>(null);
  const [leccion, setLeccion] = useState<LeccionFromMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contenidoParsed, setContenidoParsed] = useState<unknown | null>(null);

  const loadMaterialDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { MaterialEstudio } = await getQueryFactories<
        Pick<MainTypes, "MaterialEstudio">,
        "MaterialEstudio"
      >({
        entities: ["MaterialEstudio"],
      });

      // Get single material by ID with relations
      const materialRes = (await MaterialEstudio.get({
        input: { materialEstudioId: materialId },
        selectionSet: materialDetailSelectionSet,
      })) as unknown as MaterialWithRelations;

      if (materialRes) {
        setMaterial(materialRes as unknown as MaterialEstudio);

        // Extract related data
        if (materialRes.Curso) {
          setCurso(materialRes.Curso as unknown as CursoFromMaterial);
        }
        if (materialRes.Leccion) {
          setLeccion(materialRes.Leccion as unknown as LeccionFromMaterial);
        }
        // Parse contenido_generado safely and store a parsed representation
        try {
          const rawContent = materialRes.contenido_generado;
          if (!rawContent) {
            setContenidoParsed(null);
          } else {
            let parsed: unknown = rawContent as unknown;
            if (typeof rawContent === 'string') {
              // Try JSON parse, handle double-encoded strings
              parsed = JSON.parse(rawContent as string);
              if (typeof parsed === 'string') {
                try {
                  parsed = JSON.parse(parsed as string);
                } catch {
                  // keep first parse result
                }
              }
            }
            setContenidoParsed(parsed ?? null);
          }
        } catch {
          // If parsing fails, keep the raw string as fallback
          setContenidoParsed(materialRes.contenido_generado ?? null);
        }
      } else {
        setError("Material no encontrado.");
      }
    } catch (err) {
      console.error("Error loading material detail:", err);
      setError("Error al cargar el material. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  // Load material detail when materialId changes
  useEffect(() => {
    loadMaterialDetail();
  }, [loadMaterialDetail]);

  return {
    material,
    curso,
    leccion,
    loading,
    error,
    contenidoParsed,
  };
};

// Export types for convenience
export type { MaterialEstudio, Curso, Leccion };

// Export the frontend-friendly interfaces so other modules can consume them
export type { CursoFromMaterial, LeccionFromMaterial, MaterialWithRelations };
