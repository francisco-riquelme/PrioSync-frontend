/**
 * Service for managing user study blocks (horarios disponibles)
 * Uses AWS Amplify Data API to interact with BloqueEstudio model
 */

import { generateClient } from "aws-amplify/data";
import type { MainTypes } from "@/utils/api/schema";
import { DaySchedule } from "@/components/modals/welcome/types";

const client = generateClient<MainTypes>();

export type DiaSemana =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

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
    const { data, errors } = await client.models.BloqueEstudio.list({
      filter: { usuarioId: { eq: usuarioId } },
      selectionSet: [
        "bloqueEstudioId",
        "dia_semana",
        "hora_inicio",
        "hora_fin",
        "duracion_minutos",
        "usuarioId",
      ],
    });

    if (errors) {
      console.error("Error fetching study blocks:", errors);
      throw new Error("Failed to fetch study blocks");
    }

    console.log("📥 Raw data from Amplify:", JSON.stringify(data, null, 2));

    return (data || []).map((block) => {
      console.log("🔄 Mapping block:", {
        id: block.bloqueEstudioId,
        dia_semana_raw: block.dia_semana,
        dia_semana_type: typeof block.dia_semana,
      });

      return {
        bloqueEstudioId: block.bloqueEstudioId,
        dia_semana: block.dia_semana as DiaSemana,
        hora_inicio: block.hora_inicio,
        hora_fin: block.hora_fin,
        duracion_minutos: block.duracion_minutos || undefined,
        usuarioId: block.usuarioId,
      };
    });
  } catch (error) {
    console.error("Error in getUserStudyBlocks:", error);
    throw error;
  }
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
      day,
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
  if (!day) {
    console.error("❌ [normalizeDayName] Received empty day:", day);
    return "Lunes" as DiaSemana;
  }

  console.log("🔧 [normalizeDayName] Input:", day);

  const normalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  console.log("🔧 [normalizeDayName] Normalized:", normalized);

  // Mapping for special cases
  const dayMap: Record<string, DiaSemana> = {
    Lunes: "Lunes",
    Martes: "Martes",
    Miercoles: "Miércoles",
    Miércoles: "Miércoles",
    Jueves: "Jueves",
    Viernes: "Viernes",
    Sabado: "Sábado",
    Sábado: "Sábado",
    Domingo: "Domingo",
  };

  const result = dayMap[normalized] || ("Lunes" as DiaSemana);
  console.log("✅ [normalizeDayName] Result:", result);

  return result;
};

/**
 * Convert DaySchedule[] to StudyBlock[] format for backend storage
 * Includes day of the week for each block
 */
export const convertDayScheduleToStudyBlocks = (
  schedules: DaySchedule[],
  usuarioId: string
): Omit<StudyBlock, "bloqueEstudioId">[] => {
  console.log(
    "🔄 [convertDayScheduleToStudyBlocks] Input schedules:",
    schedules
  );

  const blocks: Omit<StudyBlock, "bloqueEstudioId">[] = [];

  schedules.forEach((daySchedule) => {
    console.log(
      "📅 [convertDayScheduleToStudyBlocks] Processing day:",
      daySchedule.day,
      "slots:",
      daySchedule.timeSlots.length
    );

    daySchedule.timeSlots.forEach((slot) => {
      const diaSemana = normalizeDayName(daySchedule.day);
      console.log("➕ [convertDayScheduleToStudyBlocks] Creating block:", {
        dia_semana: diaSemana,
        hora_inicio: slot.start,
        hora_fin: slot.end,
      });

      blocks.push({
        dia_semana: diaSemana,
        hora_inicio: slot.start,
        hora_fin: slot.end,
        duracion_minutos: calculateDuration(slot.start, slot.end),
        usuarioId,
      });
    });
  });

  console.log("✅ [convertDayScheduleToStudyBlocks] Created blocks:", blocks);
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
    console.log(
      "💾 [createStudyBlocks] Starting creation for user:",
      usuarioId
    );
    console.log("📋 [createStudyBlocks] Input schedules:", schedules);

    const blocks = convertDayScheduleToStudyBlocks(schedules, usuarioId);

    console.log(`📦 [createStudyBlocks] Converted to ${blocks.length} blocks`);

    // Create all blocks in parallel
    const createPromises = blocks.map((block, index) => {
      console.log(
        `🔨 [createStudyBlocks] Creating block ${index + 1}/${blocks.length}:`,
        {
          dia_semana: block.dia_semana,
          hora_inicio: block.hora_inicio,
          hora_fin: block.hora_fin,
        }
      );

      return client.models.BloqueEstudio.create({
        bloqueEstudioId: crypto.randomUUID(),
        dia_semana: block.dia_semana as DiaSemana,
        hora_inicio: block.hora_inicio,
        hora_fin: block.hora_fin,
        duracion_minutos: block.duracion_minutos,
        usuarioId: block.usuarioId,
      });
    });

    const results = await Promise.all(createPromises);

    // Check if all creations were successful
    const allSuccess = results.every((result) => !result.errors);

    if (!allSuccess) {
      const errors = results.filter((r) => r.errors).map((r) => r.errors);
      console.error(
        "❌ [createStudyBlocks] Some study blocks failed to create:",
        errors
      );
      return false;
    }

    console.log(
      `✅ [createStudyBlocks] Successfully created ${blocks.length} blocks`
    );
    return true;
  } catch (error) {
    console.error("❌ [createStudyBlocks] Error creating study blocks:", error);
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
    // First, get all existing blocks
    const blocks = await getUserStudyBlocks(usuarioId);

    if (blocks.length === 0) {
      return true; // Nothing to delete
    }

    // Delete all blocks in parallel
    const deletePromises = blocks.map((block) =>
      client.models.BloqueEstudio.delete({
        bloqueEstudioId: block.bloqueEstudioId,
      })
    );

    const results = await Promise.all(deletePromises);

    // Check if all deletions were successful
    const allSuccess = results.every((result) => !result.errors);

    if (!allSuccess) {
      const errors = results.filter((r) => r.errors).map((r) => r.errors);
      console.error("Some study blocks failed to delete:", errors);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting study blocks:", error);
    return false;
  }
};

/**
 * Update user study blocks (delete all and create new ones)
 * This is the main function used by StudyHoursManager
 */
export const updateUserStudyBlocks = async (
  usuarioId: string,
  schedules: DaySchedule[]
): Promise<boolean> => {
  try {
    // Step 1: Delete all existing blocks
    const deleteSuccess = await deleteAllUserStudyBlocks(usuarioId);
    if (!deleteSuccess) {
      console.error("Failed to delete existing study blocks");
      return false;
    }

    // Step 2: Create new blocks
    const createSuccess = await createStudyBlocks(usuarioId, schedules);
    if (!createSuccess) {
      console.error("Failed to create new study blocks");
      return false;
    }

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
};
