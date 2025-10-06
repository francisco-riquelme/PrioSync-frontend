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
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

export const steps = [
  "Información Personal",
  "Objetivos y Recursos",
  "Horarios Disponibles",
];

export const isValidYouTubeUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};
