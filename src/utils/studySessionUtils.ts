import { DaySchedule } from "@/components/modals/welcome/types";
import { CreateSesionEstudioInput } from "@/components/courses/hooks/useStudySessions";

/**
 * Mapeo de nombres de días en español a números (0 = Domingo, 1 = Lunes, etc.)
 */
const DAYS_MAP: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
};

/**
 * Obtener la próxima fecha para un día específico de la semana
 * @param dayName - Nombre del día en español (ej: "lunes")
 * @param weeksAhead - Número de semanas adelante (0 = esta semana)
 * @returns Date - La próxima fecha para ese día
 */
export const getNextDateForDay = (
  dayName: string,
  weeksAhead: number
): Date => {
  const targetDay = DAYS_MAP[dayName.toLowerCase()];

  if (targetDay === undefined) {
    throw new Error(`Día inválido: ${dayName}`);
  }

  const today = new Date();
  const currentDay = today.getDay();

  // Calcular días hasta el próximo día objetivo
  let daysUntilTarget = targetDay - currentDay;

  // Si el día ya pasó esta semana, ir a la próxima semana
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }

  // Si es el mismo día (daysUntilTarget === 0), empezar desde la próxima semana
  if (daysUntilTarget === 0) {
    daysUntilTarget = 7;
  }

  // Agregar las semanas adicionales
  const totalDays = daysUntilTarget + weeksAhead * 7;

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + totalDays);
  nextDate.setHours(0, 0, 0, 0); // Resetear hora a medianoche

  return nextDate;
};

/**
 * Calcular duración en minutos entre dos horas
 * @param start - Hora de inicio en formato HH:MM
 * @param end - Hora de fin en formato HH:MM
 * @returns number - Duración en minutos
 */
export const calculateDuration = (start: string, end: string): number => {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return endMinutes - startMinutes;
};

/**
 * Formatear fecha a formato YYYY-MM-DD
 * @param date - Objeto Date
 * @returns string - Fecha en formato YYYY-MM-DD
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Crear sesiones de estudio recurrentes basadas en disponibilidad semanal
 * @param availability - Array de disponibilidad por día con sus rangos horarios
 * @param usuarioId - ID del usuario
 * @param weeksAhead - Número de semanas a crear (por defecto 6)
 * @returns Array de CreateSesionEstudioInput listas para crear
 */
export const generateRecurringStudySessions = (
  availability: DaySchedule[],
  usuarioId: string,
  weeksAhead: number = 6
): CreateSesionEstudioInput[] => {
  const sessions: CreateSesionEstudioInput[] = [];

  // Para cada semana
  for (let week = 0; week < weeksAhead; week++) {
    // Para cada día de disponibilidad
    availability.forEach((daySchedule) => {
      // Calcular la próxima fecha de ese día
      const nextDate = getNextDateForDay(daySchedule.day, week);
      const formattedDate = formatDateToYYYYMMDD(nextDate);

      // Para cada rango horario de ese día
      daySchedule.timeSlots.forEach((timeSlot) => {
        const duracion_minutos = calculateDuration(
          timeSlot.start,
          timeSlot.end
        );

        // Crear el objeto de sesión
        const session: CreateSesionEstudioInput = {
          sesionEstudioId: crypto.randomUUID(),
          usuarioId,
          fecha: formattedDate,
          hora_inicio: timeSlot.start,
          hora_fin: timeSlot.end,
          duracion_minutos,
          tipo: "estudio",
          estado: "programada",
          cursoId: undefined,
          leccionId: undefined,
          google_event_id: undefined,
          recordatorios: undefined,
        };

        sessions.push(session);
      });
    });
  }

  return sessions;
};

/**
 * Crear sesiones de estudio en batch usando el hook
 * @param sessions - Array de sesiones a crear
 * @param createSessionFn - Función de creación del hook useStudySessions
 * @returns Promise con el resultado de la operación
 */
export const createSessionsInBatch = async (
  sessions: CreateSesionEstudioInput[],
  createSessionFn: (data: CreateSesionEstudioInput) => Promise<unknown>
): Promise<{ success: number; failed: number; total: number }> => {
  const total = sessions.length;
  let success = 0;
  let failed = 0;

  console.log(`📅 Creando ${total} sesiones de estudio recurrentes...`);

  // Crear todas las sesiones en paralelo (con límite para no saturar)
  const BATCH_SIZE = 10; // Procesar 10 a la vez

  for (let i = 0; i < sessions.length; i += BATCH_SIZE) {
    const batch = sessions.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((session) => createSessionFn(session))
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value !== null) {
        success++;
        console.log(
          `✅ Sesión creada: ${batch[index].fecha} ${batch[index].hora_inicio}-${batch[index].hora_fin}`
        );
      } else {
        failed++;
        console.error(`❌ Error creando sesión: ${batch[index].fecha}`, result);
      }
    });
  }

  console.log(`✅ Sesiones creadas: ${success}/${total}`);
  if (failed > 0) {
    console.warn(`⚠️ Sesiones fallidas: ${failed}/${total}`);
  }

  return { success, failed, total };
};
