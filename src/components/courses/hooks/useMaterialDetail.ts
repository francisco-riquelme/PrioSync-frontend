import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

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
] as const;

// Use SelectionSet to infer proper types
type MaterialWithRelations = SelectionSet<
  MaterialEstudio,
  typeof materialDetailSelectionSet
>;

// Extract nested types for easier access
type CursoFromMaterial = NonNullable<MaterialWithRelations["Curso"]>;
type LeccionFromMaterial = NonNullable<MaterialWithRelations["Leccion"]>;

export interface UseMaterialDetailParams {
  materialId: string;
}

export interface UseMaterialDetailReturn {
  material: MaterialEstudio | null;
  curso: CursoFromMaterial | null;
  leccion: LeccionFromMaterial | null;
  loading: boolean;
  error: string | null;
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
  };
};

// Export types for convenience
export type { MaterialEstudio, Curso, Leccion };
