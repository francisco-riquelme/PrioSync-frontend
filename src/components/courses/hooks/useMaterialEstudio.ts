"use client";

import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";

// Import MaterialEstudio type from MainTypes
type MaterialEstudio = MainTypes["MaterialEstudio"]["type"];

export interface UseMaterialEstudioReturn {
  materiales: MaterialEstudio[];
  material: MaterialEstudio | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMaterialEstudioParams {
  cursoId?: number | string;
  materialId?: string;
}

export const useMaterialEstudio = (
  params: UseMaterialEstudioParams | number | string
): UseMaterialEstudioReturn => {
  const [materiales, setMateriales] = useState<MaterialEstudio[]>([]);
  const [material, setMaterial] = useState<MaterialEstudio | null>(null);
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

      // If materialId is provided, fetch a single material
      if (materialId) {
        const materialRes = await MaterialEstudio.get({
          input: { materialEstudioId: materialId },
        });

        if (materialRes) {
          setMaterial(materialRes);
          setMateriales([materialRes]);
        } else {
          setError("Material no encontrado.");
        }
      }
      // Otherwise, fetch all materials for the course
      else if (cursoId) {
        const materialesRes = await MaterialEstudio.list({
          filter: {
            cursoId: { eq: cursoId.toString() },
          },
          followNextToken: true,
          maxPages: 10,
        });

        // Sort by orden field
        const sortedMateriales = (materialesRes.items || []).sort(
          (a, b) => (a.orden || 0) - (b.orden || 0)
        );

        setMateriales(sortedMateriales);
        setMaterial(null);
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
    loading,
    error,
    refetch: loadMateriales,
  };
};
