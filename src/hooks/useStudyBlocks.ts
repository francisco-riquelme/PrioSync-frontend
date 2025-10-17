import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import { DaySchedule } from "@/components/modals/welcome/types";
import {
  StudyBlock,
  DiaSemana,
  studyBlocksService,
  convertStudyBlocksToDaySchedule,
} from "@/utils/services/studyBlocks";

// Define selection set for BloqueEstudio queries
const studyBlockSelectionSet = [
  "bloqueEstudioId",
  "dia_semana",
  "hora_inicio",
  "hora_fin",
  "duracion_minutos",
  "usuarioId",
  "createdAt",
  "updatedAt",
] as const;

// Note: StudyBlockWithRelations type available if needed for future extensions

export interface UseStudyBlocksParams {
  usuarioId?: string;
}

export interface UseStudyBlocksReturn {
  studyBlocks: StudyBlock[];
  daySchedules: DaySchedule[];
  loading: boolean;
  error: string | null;
  updateStudyBlocks: (schedules: DaySchedule[]) => Promise<boolean>;
  refreshStudyBlocks: () => Promise<void>;
}

/**
 * Hook for managing user study blocks with automatic loading and state management
 * Provides CRUD operations and converts between StudyBlock and DaySchedule formats
 */
export const useStudyBlocks = (
  params: UseStudyBlocksParams
): UseStudyBlocksReturn => {
  const { usuarioId } = params;

  const [studyBlocks, setStudyBlocks] = useState<StudyBlock[]>([]);
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudyBlocks = useCallback(async () => {
    if (!usuarioId) {
      setStudyBlocks([]);
      setDaySchedules([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { BloqueEstudio } = await getQueryFactories<
        Pick<MainTypes, "BloqueEstudio">,
        "BloqueEstudio"
      >({
        entities: ["BloqueEstudio"],
      });

      // Get all study blocks for the user
      const result = await BloqueEstudio.list({
        filter: { usuarioId: { eq: usuarioId } },
        selectionSet: studyBlockSelectionSet,
      });

      const blocks: StudyBlock[] = (result.items || []).map((block) => ({
        bloqueEstudioId: block.bloqueEstudioId,
        dia_semana: block.dia_semana as DiaSemana,
        hora_inicio: block.hora_inicio,
        hora_fin: block.hora_fin,
        duracion_minutos: block.duracion_minutos || undefined,
        usuarioId: block.usuarioId,
      }));

      setStudyBlocks(blocks);

      // Convert to DaySchedule format for UI consumption
      const schedules = convertStudyBlocksToDaySchedule(blocks);
      setDaySchedules(schedules);
    } catch (err) {
      console.error("Error loading study blocks:", err);
      setError(
        "Error al cargar los horarios de estudio. Por favor, intenta nuevamente."
      );
      setStudyBlocks([]);
      setDaySchedules([]);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  const updateStudyBlocks = useCallback(
    async (schedules: DaySchedule[]): Promise<boolean> => {
      if (!usuarioId) {
        setError("Usuario no autenticado");
        return false;
      }

      try {
        setError(null);

        // Use the service to update study blocks
        const success = await studyBlocksService.updateUserStudyBlocks(
          usuarioId,
          schedules
        );

        if (success) {
          // Refresh the data after successful update
          await loadStudyBlocks();
        } else {
          setError("Error al guardar los horarios de estudio");
        }

        return success;
      } catch (err) {
        console.error("Error updating study blocks:", err);
        setError("Error al actualizar los horarios de estudio");
        return false;
      }
    },
    [usuarioId, loadStudyBlocks]
  );

  const refreshStudyBlocks = useCallback(async () => {
    await loadStudyBlocks();
  }, [loadStudyBlocks]);

  // Load study blocks when usuarioId changes
  useEffect(() => {
    loadStudyBlocks();
  }, [loadStudyBlocks]);

  return {
    studyBlocks,
    daySchedules,
    loading,
    error,
    updateStudyBlocks,
    refreshStudyBlocks,
  };
};

// Export types for convenience
export type { StudyBlock, DiaSemana };
