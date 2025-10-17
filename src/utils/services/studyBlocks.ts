/**
 * Service for managing user study blocks (horarios disponibles)
 * Uses AWS Amplify Data API to interact with BloqueEstudio model
 */

import { getQueryFactories } from "@/utils/commons/queries";
import type { MainTypes } from "@/utils/api/schema";
import { DaySchedule } from "@/components/modals/welcome/types";
import type { SelectionSet } from "aws-amplify/data";

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

// Infer DiaSemana type from schema using SelectionSet
type BloqueEstudioData = SelectionSet<
  MainTypes["BloqueEstudio"]["type"],
  typeof studyBlockSelectionSet
>;

export type DiaSemana = NonNullable<BloqueEstudioData["dia_semana"]>;

export interface StudyBlock {
  bloqueEstudioId: string;
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos?: number;
  usuarioId: string;
}

/**
 * Calculate duration in minutes between two time strings
 */
const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
};

/**
 * Fetch all study blocks for a user
 */
export const getUserStudyBlocks = async (
  usuarioId: string
): Promise<StudyBlock[]> => {
  try {
    const { BloqueEstudio } = await getQueryFactories<
      Pick<MainTypes, "BloqueEstudio">,
      "BloqueEstudio"
    >({
      entities: ["BloqueEstudio"],
    });

    const result = await BloqueEstudio.list({
      filter: { usuarioId: { eq: usuarioId } },
      selectionSet: studyBlockSelectionSet,
    });

    return (result.items || []).map((block) => ({
      bloqueEstudioId: block.bloqueEstudioId,
      dia_semana: block.dia_semana as DiaSemana,
      hora_inicio: block.hora_inicio,
      hora_fin: block.hora_fin,
      duracion_minutos: block.duracion_minutos || undefined,
      usuarioId: block.usuarioId,
    }));
  } catch (error) {
    console.error("Error in getUserStudyBlocks:", error);
    throw error;
  }
};

/**
 * Map frontend day names (lowercase, with accents) to backend format (capitalized, no accents)
 */
const frontendToBackendDayMap: Record<string, DiaSemana> = {
  lunes: "Lunes",
  martes: "Martes",
  miércoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sábado: "Sabado",
  domingo: "Domingo",
};

/**
 * Normalize frontend day name to backend format
 */
export const normalizeDayNameToBackend = (frontendDay: string): DiaSemana => {
  return frontendToBackendDayMap[frontendDay] as DiaSemana;
};

/**
 * Map backend day names (capitalized, no accents) to frontend format (lowercase, with accents)
 */
const backendToFrontendDayMap: Record<string, string> = {
  Lunes: "lunes",
  Martes: "martes",
  Miercoles: "miércoles",
  Jueves: "jueves",
  Viernes: "viernes",
  Sabado: "sábado",
  Domingo: "domingo",
};

/**
 * Normalize backend day name to frontend format
 */
const normalizeDayNameForUI = (backendDay: string): string => {
  return backendToFrontendDayMap[backendDay] || backendDay.toLowerCase();
};

/**
 * Convert StudyBlock[] to DaySchedule[] format for UI consumption
 * Groups blocks by day of the week
 */
export const convertStudyBlocksToDaySchedule = (
  blocks: StudyBlock[]
): DaySchedule[] => {
  if (!blocks || blocks.length === 0) {
    return [];
  }

  // Group blocks by day
  const blocksByDay: Record<string, StudyBlock[]> = {};

  blocks.forEach((block) => {
    const day = block.dia_semana;
    if (!blocksByDay[day]) {
      blocksByDay[day] = [];
    }
    blocksByDay[day].push(block);
  });

  // Convert to DaySchedule format
  const daySchedules: DaySchedule[] = Object.entries(blocksByDay).map(
    ([day, dayBlocks]) => ({
      day: normalizeDayNameForUI(day), // Normalize to frontend format
      timeSlots: dayBlocks.map((block) => ({
        start: block.hora_inicio,
        end: block.hora_fin,
      })),
    })
  );

  console.log(
    `✅ Converted ${blocks.length} study blocks into ${daySchedules.length} day schedules`
  );

  return daySchedules;
};

/**
 * Normalize day name to match DiaSemana enum
 */
const normalizeDayName = (day: string): DiaSemana => {
  const normalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

  const dayMap: Record<string, string> = {
    Lunes: "Lunes",
    Martes: "Martes",
    Miercoles: "Miercoles",
    Jueves: "Jueves",
    Viernes: "Viernes",
    Sabado: "Sabado",
    Domingo: "Domingo",
  };

  return (dayMap[normalized] as DiaSemana) || ("Lunes" as DiaSemana);
};

/**
 * Convert database day name (without tilde) to display name (with tilde)
 * Backend: "Miercoles", "Sabado" -> Frontend: "Miércoles", "Sábado"
 */
export const getDisplayDayName = (diaSemana: DiaSemana): string => {
  const displayMap: Record<string, string> = {
    Lunes: "Lunes",
    Martes: "Martes",
    Miercoles: "Miércoles",
    Jueves: "Jueves",
    Viernes: "Viernes",
    Sabado: "Sábado",
    Domingo: "Domingo",
  };

  return displayMap[diaSemana] || diaSemana;
};

/**
 * Convert DaySchedule[] to StudyBlock[] format for backend storage
 * Includes day of the week for each block
 */
export const convertDayScheduleToStudyBlocks = (
  schedules: DaySchedule[],
  usuarioId: string
): Omit<StudyBlock, "bloqueEstudioId">[] => {
  const blocks: Omit<StudyBlock, "bloqueEstudioId">[] = [];

  schedules.forEach((daySchedule) => {
    daySchedule.timeSlots.forEach((slot) => {
      blocks.push({
        dia_semana: normalizeDayName(daySchedule.day),
        hora_inicio: slot.start,
        hora_fin: slot.end,
        duracion_minutos: calculateDuration(slot.start, slot.end),
        usuarioId,
      });
    });
  });

  return blocks;
};

/**
 * Create multiple study blocks for a user
 */
export const createStudyBlocks = async (
  usuarioId: string,
  schedules: DaySchedule[]
): Promise<boolean> => {
  try {
    const { BloqueEstudio } = await getQueryFactories<
      Pick<MainTypes, "BloqueEstudio">,
      "BloqueEstudio"
    >({
      entities: ["BloqueEstudio"],
    });

    const blocks = convertDayScheduleToStudyBlocks(schedules, usuarioId);

    // Create all blocks in parallel
    const createPromises = blocks.map((block) =>
      BloqueEstudio.create({
        input: {
          bloqueEstudioId: crypto.randomUUID(),
          dia_semana: block.dia_semana as DiaSemana,
          hora_inicio: block.hora_inicio,
          hora_fin: block.hora_fin,
          duracion_minutos: block.duracion_minutos,
          usuarioId: block.usuarioId,
        },
        selectionSet: studyBlockSelectionSet,
      })
    );

    const results = await Promise.all(createPromises);

    // Check if all creations were successful
    const allSuccess = results.every((result) => result);

    if (!allSuccess) {
      console.error("Some study blocks failed to create");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error creating study blocks:", error);
    return false;
  }
};

/**
 * Delete all study blocks for a user
 */
export const deleteAllUserStudyBlocks = async (
  usuarioId: string
): Promise<boolean> => {
  try {
    const { BloqueEstudio } = await getQueryFactories<
      Pick<MainTypes, "BloqueEstudio">,
      "BloqueEstudio"
    >({
      entities: ["BloqueEstudio"],
    });

    // First, get all existing blocks
    const blocks = await getUserStudyBlocks(usuarioId);

    if (blocks.length === 0) {
      return true; // Nothing to delete
    }

    // Delete all blocks in parallel
    const deletePromises = blocks.map((block) =>
      BloqueEstudio.delete({
        input: {
          bloqueEstudioId: block.bloqueEstudioId,
        },
        selectionSet: studyBlockSelectionSet,
      })
    );

    const results = await Promise.all(deletePromises);

    // Check if all deletions were successful
    const allSuccess = results.every((result) => result);

    if (!allSuccess) {
      console.error("Some study blocks failed to delete");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting study blocks:", error);
    return false;
  }
};

/**
 * Update user study blocks with smart diffing (only touch changed blocks)
 * This is the main function used by StudyHoursManager
 */
export const updateUserStudyBlocks = async (
  usuarioId: string,
  schedules: DaySchedule[]
): Promise<boolean> => {
  try {
    const { BloqueEstudio } = await getQueryFactories<
      Pick<MainTypes, "BloqueEstudio">,
      "BloqueEstudio"
    >({
      entities: ["BloqueEstudio"],
    });

    // Get existing blocks
    const existingBlocks = await getUserStudyBlocks(usuarioId);
    const newBlocks = convertDayScheduleToStudyBlocks(schedules, usuarioId);

    // Find blocks to delete (exist in DB but not in new data)
    const toDelete = existingBlocks.filter(
      (existing) =>
        !newBlocks.some(
          (newBlock) =>
            newBlock.dia_semana === existing.dia_semana &&
            newBlock.hora_inicio === existing.hora_inicio &&
            newBlock.hora_fin === existing.hora_fin
        )
    );

    // Find blocks to create (exist in new data but not in DB)
    const toCreate = newBlocks.filter(
      (newBlock) =>
        !existingBlocks.some(
          (existing) =>
            existing.dia_semana === newBlock.dia_semana &&
            existing.hora_inicio === newBlock.hora_inicio &&
            existing.hora_fin === newBlock.hora_fin
        )
    );

    console.log(
      `🔄 Updating study blocks: ${toDelete.length} to delete, ${toCreate.length} to create`
    );

    // Execute operations in parallel
    const operations = [
      ...toDelete.map((block) =>
        BloqueEstudio.delete({
          input: { bloqueEstudioId: block.bloqueEstudioId },
          selectionSet: studyBlockSelectionSet,
        })
      ),
      ...toCreate.map((block) =>
        BloqueEstudio.create({
          input: {
            bloqueEstudioId: crypto.randomUUID(),
            dia_semana: block.dia_semana as DiaSemana,
            hora_inicio: block.hora_inicio,
            hora_fin: block.hora_fin,
            duracion_minutos: block.duracion_minutos,
            usuarioId: block.usuarioId,
          },
          selectionSet: studyBlockSelectionSet,
        })
      ),
    ];

    if (operations.length > 0) {
      const results = await Promise.all(operations);
      const allSuccess = results.every((result) => result);

      if (!allSuccess) {
        console.error("Some study block operations failed");
        return false;
      }
    }

    console.log("✅ Study blocks updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating study blocks:", error);
    return false;
  }
};

export const studyBlocksService = {
  getUserStudyBlocks,
  convertStudyBlocksToDaySchedule,
  convertDayScheduleToStudyBlocks,
  createStudyBlocks,
  deleteAllUserStudyBlocks,
  updateUserStudyBlocks,
  getDisplayDayName,
};
