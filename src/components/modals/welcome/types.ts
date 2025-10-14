export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySchedule {
  day: string;
  timeSlots: TimeSlot[];
}

export interface WelcomeFormData {
  nombre: string;
  estudio: string;
  youtubeUrl: string;
  tiempoDisponible: DaySchedule[];
}

export const daysOfWeek = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miércoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sábado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export const timeSlots = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

export const steps = [
  "Información Personal",
  "Objetivos y Recursos",
  "Horarios Disponibles",
];

export const isValidYouTubeUrl = (url: string): boolean => {
  // Acepta URLs de YouTube con playlist o videos individuales
  // Ejemplos válidos:
  // - https://youtube.com/playlist?list=PLO9JpmNAsqM6RttdyDmPyW0vR_zf20ETI
  // - https://www.youtube.com/watch?v=dQw4w9WgXcQ
  // - https://youtu.be/dQw4w9WgXcQ
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(playlist\?list=|watch\?v=)|youtu\.be\/).+/;
  return youtubeRegex.test(url);
};
