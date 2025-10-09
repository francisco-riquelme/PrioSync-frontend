"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import type { SelectionSet } from "aws-amplify/data";

// Import types from MainTypes
type MaterialEstudio = MainTypes["MaterialEstudio"]["type"];
// type Curso = MainTypes["Curso"]["type"];
// type Leccion = MainTypes["Leccion"]["type"];

// Define selection sets as const arrays
const materialWithRelationsSelectionSet = [
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

const basicMaterialSelectionSet = [
  "materialEstudioId",
  "titulo",
  "tipo",
  "url_contenido",
  "orden",
  "descripcion",
  "cuestionarioId",
  "cursoId",
  "leccionId",
] as const;

// Use SelectionSet to infer proper types
type MaterialWithRelations = SelectionSet<
  MaterialEstudio,
  typeof materialWithRelationsSelectionSet
>;
// type BasicMaterial = SelectionSet<
//   MaterialEstudio,
//   typeof basicMaterialSelectionSet
// >;

// Extract nested types for easier access
type CursoFromMaterial = NonNullable<MaterialWithRelations["Curso"]>;
type LeccionFromMaterial = NonNullable<MaterialWithRelations["Leccion"]>;

export interface UseMaterialEstudioReturn {
  materiales: MaterialEstudio[];
  material: MaterialEstudio | null;
  curso: CursoFromMaterial | null;
  leccion: LeccionFromMaterial | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMaterialEstudioParams {
  cursoId?: number | string;
  materialId?: string;
}

/**
 * Hook for fetching study materials
 * - If materialId is provided: fetches single material with its course and lesson
 * - If cursoId is provided: fetches all materials for the course
 * Always uses full selectionSet for complete data
 */
export const useMaterialEstudio = (
  params: UseMaterialEstudioParams | number | string
): UseMaterialEstudioReturn => {
  const [materiales, setMateriales] = useState<MaterialEstudio[]>([]);
  const [material, setMaterial] = useState<MaterialEstudio | null>(null);
  const [curso, setCurso] = useState<CursoFromMaterial | null>(null);
  const [leccion, setLeccion] = useState<LeccionFromMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize params to object format
  const normalizedParams: UseMaterialEstudioParams =
    typeof params === "object" ? params : { cursoId: params };

  const { cursoId, materialId } = normalizedParams;

  // Load materials or a single material
  const loadMateriales = useCallback(async () => {
    if (!cursoId && !materialId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the query factories pattern
      const { MaterialEstudio } = await getQueryFactories<
        MainTypes,
        "MaterialEstudio"
      >({
        entities: ["MaterialEstudio"],
      });

      // If materialId is provided, fetch a single material with full relations
      if (materialId) {
        const materialRes = (await MaterialEstudio.get({
          input: { materialEstudioId: materialId },
          selectionSet: materialWithRelationsSelectionSet,
        })) as unknown as MaterialWithRelations;

        if (materialRes) {
          setMaterial(materialRes as unknown as MaterialEstudio);
          setMateriales([materialRes as unknown as MaterialEstudio]);

          // Always extract related data since we always fetch it
          if (materialRes.Curso) {
            setCurso(materialRes.Curso as unknown as CursoFromMaterial);
          }
          if (materialRes.Leccion) {
            setLeccion(materialRes.Leccion as unknown as LeccionFromMaterial);
          }
        } else {
          setError("Material no encontrado.");
        }
      }
      // Otherwise, fetch all materials for the course with basic selectionSet for list
      else if (cursoId) {
        const materialesRes = await MaterialEstudio.list({
          filter: {
            cursoId: { eq: cursoId.toString() },
          },
          followNextToken: true,
          maxPages: 10,
          selectionSet: basicMaterialSelectionSet,
        });

        // Sort by orden field
        const sortedMateriales = (materialesRes.items || []).sort(
          (a, b) => (a.orden || 0) - (b.orden || 0)
        );

        setMateriales(sortedMateriales as unknown as MaterialEstudio[]);
        setMaterial(null);
        setCurso(null);
        setLeccion(null);
      }
    } catch (err) {
      console.error("Error loading materiales:", err);
      setError(
        "Error al cargar los materiales de estudio. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }, [cursoId, materialId]);

  // Load materials when params change
  useEffect(() => {
    loadMateriales();
  }, [loadMateriales]);

  return {
    materiales,
    material,
    curso,
    leccion,
    loading,
    error,
    refetch: loadMateriales,
  };
};
