import { useState, useEffect, useCallback } from "react";
import { getQueryFactories } from "@/utils/commons/queries";
import { MainTypes } from "@/utils/api/schema";
import { DaySchedule, TimeSlot } from "@/components/modals/welcome/types";
import {
  StudyBlock,
  DiaSemana,
  convertStudyBlocksToDaySchedule,
  normalizeDayNameToBackend,
} from "@/utils/services/studyBlocks";

// Define selection set for Usuario with BloqueEstudio relationship
const usuarioWithBloqueEstudioSelectionSet = [
  "usuarioId",
  "BloqueEstudio.bloqueEstudioId",
  "BloqueEstudio.dia_semana",
  "BloqueEstudio.hora_inicio",
  "BloqueEstudio.hora_fin",
  "BloqueEstudio.duracion_minutos",
  "BloqueEstudio.usuarioId",
] as const;

// Lightweight interfaces to avoid complex SelectionSet unions
type UsuarioBloqueEstudioLite = {
  readonly bloqueEstudioId: string;
  readonly dia_semana: string;
  readonly hora_inicio: string;
  readonly hora_fin: string;
  readonly duracion_minutos: number | null;
  readonly usuarioId: string;
};

type UsuarioWithBloqueEstudioLite = {
  readonly usuarioId: string;
  readonly BloqueEstudio: readonly UsuarioBloqueEstudioLite[] | null;
};

export interface UseStudyBlocksParams {
  usuarioId?: string;
}

export interface UseStudyBlocksReturn {
  studyBlocks: StudyBlock[];
  daySchedules: DaySchedule[];
  loading: boolean;
  error: string | null;
  createSingleBlock: (day: string, slot: TimeSlot) => Promise<boolean>;
  deleteSingleBlock: (day: string, slot: TimeSlot) => Promise<boolean>;
  updateSingleBlock: (
    day: string,
    oldSlot: TimeSlot,
    newSlot: TimeSlot
  ) => Promise<boolean>;
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

  // Helper function to calculate duration
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    return endHour * 60 + endMin - (startHour * 60 + startMin);
  };

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

      const { Usuario } = await getQueryFactories<
        Pick<MainTypes, "Usuario">,
        "Usuario"
      >({
        entities: ["Usuario"],
      });

      // Get user with their study blocks via relationship
      const userRes = (await Usuario.get({
        input: { usuarioId },
        selectionSet: usuarioWithBloqueEstudioSelectionSet,
      })) as unknown as UsuarioWithBloqueEstudioLite;

      // Access the BloqueEstudio relationship data
      const blocks: StudyBlock[] = (userRes?.BloqueEstudio || []).map(
        (block) => ({
          bloqueEstudioId: block.bloqueEstudioId,
          dia_semana: block.dia_semana as DiaSemana,
          hora_inicio: block.hora_inicio,
          hora_fin: block.hora_fin,
          duracion_minutos: block.duracion_minutos || undefined,
          usuarioId: block.usuarioId,
        })
      );

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

  const createSingleBlock = useCallback(
    async (day: string, slot: TimeSlot): Promise<boolean> => {
      if (!usuarioId) return false;

      try {
        const { BloqueEstudio } = await getQueryFactories<
          Pick<MainTypes, "BloqueEstudio">,
          "BloqueEstudio"
        >({
          entities: ["BloqueEstudio"],
        });

        const newBlock = {
          bloqueEstudioId: crypto.randomUUID(),
          dia_semana: normalizeDayNameToBackend(day),
          hora_inicio: slot.start,
          hora_fin: slot.end,
          duracion_minutos: calculateDuration(slot.start, slot.end),
          usuarioId,
        };

        await BloqueEstudio.create({
          input: newBlock,
          selectionSet: [
            "bloqueEstudioId",
            "dia_semana",
            "hora_inicio",
            "hora_fin",
            "duracion_minutos",
            "usuarioId",
          ],
        });

        // Update local studyBlocks state
        setStudyBlocks((prev) => [...prev, newBlock as StudyBlock]);

        // Update local daySchedules state
        setDaySchedules((prev) => {
          const existingDay = prev.find((d) => d.day === day);
          if (existingDay) {
            return prev.map((d) =>
              d.day === day
                ? {
                    ...d,
                    timeSlots: [...d.timeSlots, slot].sort((a, b) =>
                      a.start.localeCompare(b.start)
                    ),
                  }
                : d
            );
          } else {
            return [...prev, { day, timeSlots: [slot] }];
          }
        });

        return true;
      } catch (error) {
        console.error("Error creating study block:", error);
        return false;
      }
    },
    [usuarioId]
  );

  const deleteSingleBlock = useCallback(
    async (day: string, slot: TimeSlot): Promise<boolean> => {
      if (!usuarioId) return false;

      try {
        // Find the block ID by matching day and time
        const blockToDelete = studyBlocks.find(
          (b) =>
            convertStudyBlocksToDaySchedule([b])[0]?.day === day &&
            b.hora_inicio === slot.start &&
            b.hora_fin === slot.end
        );

        if (!blockToDelete) {
          console.error("Block not found to delete");
          return false;
        }

        const { BloqueEstudio } = await getQueryFactories<
          Pick<MainTypes, "BloqueEstudio">,
          "BloqueEstudio"
        >({
          entities: ["BloqueEstudio"],
        });

        await BloqueEstudio.delete({
          input: { bloqueEstudioId: blockToDelete.bloqueEstudioId },
        });

        // Update local studyBlocks state
        setStudyBlocks((prev) =>
          prev.filter(
            (b) => b.bloqueEstudioId !== blockToDelete.bloqueEstudioId
          )
        );

        // Update local daySchedules state
        setDaySchedules((prev) =>
          prev
            .map((d) =>
              d.day === day
                ? {
                    ...d,
                    timeSlots: d.timeSlots.filter(
                      (t) => !(t.start === slot.start && t.end === slot.end)
                    ),
                  }
                : d
            )
            .filter((d) => d.timeSlots.length > 0)
        );

        return true;
      } catch (error) {
        console.error("Error deleting study block:", error);
        return false;
      }
    },
    [usuarioId, studyBlocks]
  );

  const updateSingleBlock = useCallback(
    async (
      day: string,
      oldSlot: TimeSlot,
      newSlot: TimeSlot
    ): Promise<boolean> => {
      if (!usuarioId) return false;

      try {
        // Find the block to update
        const blockToUpdate = studyBlocks.find(
          (b) =>
            convertStudyBlocksToDaySchedule([b])[0]?.day === day &&
            b.hora_inicio === oldSlot.start &&
            b.hora_fin === oldSlot.end
        );

        if (!blockToUpdate) {
          console.error("Block not found to update");
          return false;
        }

        const { BloqueEstudio } = await getQueryFactories<
          Pick<MainTypes, "BloqueEstudio">,
          "BloqueEstudio"
        >({
          entities: ["BloqueEstudio"],
        });

        const updatedBlock = {
          bloqueEstudioId: blockToUpdate.bloqueEstudioId,
          dia_semana: normalizeDayNameToBackend(day),
          hora_inicio: newSlot.start,
          hora_fin: newSlot.end,
          duracion_minutos: calculateDuration(newSlot.start, newSlot.end),
          usuarioId,
        };

        await BloqueEstudio.update({
          input: updatedBlock,
          selectionSet: [
            "bloqueEstudioId",
            "dia_semana",
            "hora_inicio",
            "hora_fin",
            "duracion_minutos",
            "usuarioId",
          ],
        });

        // Update local studyBlocks state
        setStudyBlocks((prev) =>
          prev.map((b) =>
            b.bloqueEstudioId === blockToUpdate.bloqueEstudioId
              ? (updatedBlock as StudyBlock)
              : b
          )
        );

        // Update local daySchedules state
        setDaySchedules((prev) =>
          prev.map((d) =>
            d.day === day
              ? {
                  ...d,
                  timeSlots: d.timeSlots
                    .map((t) =>
                      t.start === oldSlot.start && t.end === oldSlot.end
                        ? newSlot
                        : t
                    )
                    .sort((a, b) => a.start.localeCompare(b.start)),
                }
              : d
          )
        );

        return true;
      } catch (error) {
        console.error("Error updating study block:", error);
        return false;
      }
    },
    [usuarioId, studyBlocks]
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
    createSingleBlock,
    deleteSingleBlock,
    updateSingleBlock,
    refreshStudyBlocks,
  };
};

// Export types for convenience
export type { StudyBlock, DiaSemana };
