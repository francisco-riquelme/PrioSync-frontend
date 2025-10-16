/**
 * Migration utility to convert Cognito custom attributes to BloqueEstudio records
 * This should be called after user confirms their account
 */

import { fetchUserAttributes } from "aws-amplify/auth";
import { DaySchedule, TimeSlot } from "@/components/modals/welcome/types";
import { studyBlocksService } from "./studyBlocks";

interface CognitoCustomAttributes {
  "custom:firstSlotStart"?: string;
  "custom:firstSlotEnd"?: string;
  "custom:secondSlotStart"?: string;
  "custom:secondSlotEnd"?: string;
  "custom:thirdSlotStart"?: string;
  "custom:thirdSlotEnd"?: string;
  "custom:fourthSlotStart"?: string;
  "custom:fourthSlotEnd"?: string;
  "custom:fifthSlotStart"?: string;
  "custom:fifthSlotEnd"?: string;
  "custom:areaOfInterest"?: string;
  "custom:playlistUrl"?: string;
}

/**
 * Extract time slots from Cognito custom attributes
 */
const extractTimeSlotsFromAttributes = (
  attributes: CognitoCustomAttributes
): TimeSlot[] => {
  const slots: TimeSlot[] = [];

  // Extract up to 5 slots
  if (
    attributes["custom:firstSlotStart"] &&
    attributes["custom:firstSlotEnd"]
  ) {
    slots.push({
      start: attributes["custom:firstSlotStart"],
      end: attributes["custom:firstSlotEnd"],
    });
  }

  if (
    attributes["custom:secondSlotStart"] &&
    attributes["custom:secondSlotEnd"]
  ) {
    slots.push({
      start: attributes["custom:secondSlotStart"],
      end: attributes["custom:secondSlotEnd"],
    });
  }

  if (
    attributes["custom:thirdSlotStart"] &&
    attributes["custom:thirdSlotEnd"]
  ) {
    slots.push({
      start: attributes["custom:thirdSlotStart"],
      end: attributes["custom:thirdSlotEnd"],
    });
  }

  if (
    attributes["custom:fourthSlotStart"] &&
    attributes["custom:fourthSlotEnd"]
  ) {
    slots.push({
      start: attributes["custom:fourthSlotStart"],
      end: attributes["custom:fourthSlotEnd"],
    });
  }

  if (
    attributes["custom:fifthSlotStart"] &&
    attributes["custom:fifthSlotEnd"]
  ) {
    slots.push({
      start: attributes["custom:fifthSlotStart"],
      end: attributes["custom:fifthSlotEnd"],
    });
  }

  return slots;
};

/**
 * Migrate study blocks from Cognito custom attributes to DynamoDB BloqueEstudio table
 * Should be called after successful login for first-time users
 */
export const migrateStudyBlocksFromCognito = async (
  usuarioId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if user already has study blocks in database
    const existingBlocks =
      await studyBlocksService.getUserStudyBlocks(usuarioId);

    if (existingBlocks && existingBlocks.length > 0) {
      console.log("User already has study blocks, skipping migration");
      return { success: true };
    }

    // Fetch Cognito user attributes
    const attributes = await fetchUserAttributes();

    // Extract time slots
    const timeSlots = extractTimeSlotsFromAttributes(
      attributes as unknown as CognitoCustomAttributes
    );

    if (timeSlots.length === 0) {
      console.log("No time slots found in Cognito attributes");
      return { success: true }; // Not an error, just no data to migrate
    }

    // Convert to DaySchedule format (without day grouping for now)
    // Backend doesn't store day information yet
    const schedules: DaySchedule[] = [
      {
        day: "general", // Temporary placeholder
        timeSlots: timeSlots,
      },
    ];

    // Save to database
    const migrationSuccess = await studyBlocksService.createStudyBlocks(
      usuarioId,
      schedules
    );

    if (!migrationSuccess) {
      throw new Error("Failed to save study blocks to database");
    }

    console.log(
      `Successfully migrated ${timeSlots.length} study blocks for user ${usuarioId}`
    );

    return { success: true };
  } catch (error) {
    console.error("Error migrating study blocks from Cognito:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during migration",
    };
  }
};

/**
 * Migrate study blocks from localStorage to backend
 * This is useful when user has data in localStorage but not in backend
 */
export const migrateStudyBlocksFromLocalStorage = async (
  usuarioId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if user already has study blocks in database
    const existingBlocks =
      await studyBlocksService.getUserStudyBlocks(usuarioId);

    if (existingBlocks && existingBlocks.length > 0) {
      console.log("User already has study blocks, skipping migration");
      return { success: true };
    }

    // Get data from localStorage
    const savedWelcomeData = localStorage.getItem("welcomeFormData");

    if (!savedWelcomeData) {
      console.log("No welcome data found in localStorage");
      return { success: true }; // Not an error, just no data to migrate
    }

    const welcomeData = JSON.parse(savedWelcomeData);
    const schedules: DaySchedule[] = welcomeData.tiempoDisponible || [];

    if (
      schedules.length === 0 ||
      schedules.every((s) => s.timeSlots.length === 0)
    ) {
      console.log("No time slots found in localStorage");
      return { success: true };
    }

    // Save to database
    const migrationSuccess = await studyBlocksService.createStudyBlocks(
      usuarioId,
      schedules
    );

    if (!migrationSuccess) {
      throw new Error("Failed to save study blocks to database");
    }

    const totalSlots = schedules.reduce(
      (sum, s) => sum + s.timeSlots.length,
      0
    );
    console.log(
      `Successfully migrated ${totalSlots} study blocks from localStorage for user ${usuarioId}`
    );

    return { success: true };
  } catch (error) {
    console.error("Error migrating study blocks from localStorage:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error during migration",
    };
  }
};

export const migrationService = {
  migrateStudyBlocksFromCognito,
  migrateStudyBlocksFromLocalStorage,
};
