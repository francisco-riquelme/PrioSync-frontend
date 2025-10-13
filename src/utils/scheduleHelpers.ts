/**
 * Utilidades para trabajar con horarios y preferencias de usuario
 */

import { DaySchedule, TimeSlot } from "@/components/modals/welcome/types";

/**
 * Obtiene el nombre del día en español para una fecha dada
 */
export const getDayName = (date: Date): string => {
  const days = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  return days[date.getDay()];
};

/**
 * Obtiene los slots de tiempo preferidos para una fecha específica
 */
export const getPreferredSlotsForDate = (
  date: Date,
  preferences: DaySchedule[]
): TimeSlot[] => {
  const dayName = getDayName(date);
  const daySchedule = preferences.find((p) => p.day.toLowerCase() === dayName);
  return daySchedule?.timeSlots || [];
};

/**
 * Verifica si una hora específica está dentro de un rango preferido
 */
export const isPreferredTime = (
  time: string,
  date: Date,
  preferences: DaySchedule[]
): boolean => {
  const slots = getPreferredSlotsForDate(date, preferences);

  // Convertir hora a minutos para comparación más fácil
  const timeToMinutes = (t: string): number => {
    const [hours, minutes] = t.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const timeMinutes = timeToMinutes(time);

  return slots.some((slot) => {
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  });
};

/**
 * Verifica si un rango de tiempo completo está dentro de las preferencias
 */
export const isTimeRangePreferred = (
  startTime: string,
  endTime: string,
  date: Date,
  preferences: DaySchedule[]
): boolean => {
  const slots = getPreferredSlotsForDate(date, preferences);

  if (slots.length === 0) return false;

  const timeToMinutes = (t: string): number => {
    const [hours, minutes] = t.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Verificar si el rango completo está dentro de algún slot preferido
  return slots.some((slot) => {
    const slotStartMinutes = timeToMinutes(slot.start);
    const slotEndMinutes = timeToMinutes(slot.end);
    return startMinutes >= slotStartMinutes && endMinutes <= slotEndMinutes;
  });
};

/**
 * Obtiene la clase CSS para colorear un slot del calendario
 */
export const getSlotColorClass = (
  date: Date,
  preferences: DaySchedule[]
): string => {
  const slots = getPreferredSlotsForDate(date, preferences);
  return slots.length > 0 ? "preferred-slot" : "normal-slot";
};

/**
 * Formatea un TimeSlot para mostrar en la UI
 */
export const formatTimeSlot = (slot: TimeSlot): string => {
  return `${slot.start} - ${slot.end}`;
};

/**
 * Calcula la duración en minutos de un slot
 */
export const getSlotDuration = (slot: TimeSlot): number => {
  const timeToMinutes = (t: string): number => {
    const [hours, minutes] = t.split(":").map(Number);
    return hours * 60 + minutes;
  };

  return timeToMinutes(slot.end) - timeToMinutes(slot.start);
};

/**
 * Agrupa slots por día de la semana
 */
export const groupSlotsByDay = (
  preferences: DaySchedule[]
): Record<string, TimeSlot[]> => {
  const grouped: Record<string, TimeSlot[]> = {};

  preferences.forEach((daySchedule) => {
    grouped[daySchedule.day] = daySchedule.timeSlots;
  });

  return grouped;
};

/**
 * Obtiene el siguiente slot disponible después de una fecha/hora dada
 */
export const getNextAvailableSlot = (
  currentDate: Date,
  preferences: DaySchedule[]
): { date: Date; slot: TimeSlot } | null => {
  const maxDaysToCheck = 7; // Buscar en la próxima semana

  for (let i = 0; i < maxDaysToCheck; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + i);

    const slots = getPreferredSlotsForDate(checkDate, preferences);
    if (slots.length > 0) {
      return {
        date: checkDate,
        slot: slots[0], // Retornar el primer slot del día
      };
    }
  }

  return null;
};

/**
 * Calcula estadísticas de uso de horarios preferidos
 */
export interface ScheduleStats {
  totalSessions: number;
  preferredSessions: number;
  adherencePercentage: number;
}

export const calculateScheduleAdherence = (
  sessions: Array<{ startTime: Date; endTime: Date }>,
  preferences: DaySchedule[]
): ScheduleStats => {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      preferredSessions: 0,
      adherencePercentage: 0,
    };
  }

  const preferredSessions = sessions.filter((session) => {
    const startTimeStr = session.startTime.toTimeString().slice(0, 5);
    const endTimeStr = session.endTime.toTimeString().slice(0, 5);
    return isTimeRangePreferred(
      startTimeStr,
      endTimeStr,
      session.startTime,
      preferences
    );
  }).length;

  return {
    totalSessions: sessions.length,
    preferredSessions,
    adherencePercentage: Math.round(
      (preferredSessions / sessions.length) * 100
    ),
  };
};
