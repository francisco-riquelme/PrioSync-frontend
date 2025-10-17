// Tipos para sesiones de estudio
export interface StudySession {
  id: string;
  title: string;
  subject: string; // Materia/curso relacionado
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string; // Biblioteca, casa, etc.
  priority: "high" | "medium" | "low";
  status: "planned" | "in-progress" | "completed" | "cancelled";
  reminder?: number; // Minutos antes para recordatorio
  tags?: string[]; // Tags como ["examen", "proyecto", "repaso"]
  createdAt: Date;
  updatedAt: Date;
  cursoId?: string; // NEW
  leccionId?: string; // NEW
}

// Formulario para crear/editar sesión
export interface StudySessionFormData {
  title: string;
  subject: string;
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endDate: string; // YYYY-MM-DD format
  endTime: string; // HH:MM format
  description?: string;
  location?: string;
  priority: "high" | "medium" | "low";
  reminder?: number;
  tags?: string[];
}

// Opciones para filtrar sesiones
export interface StudySessionFilters {
  subject?: string;
  priority?: "high" | "medium" | "low";
  status?: "planned" | "in-progress" | "completed" | "cancelled";
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Opciones de prioridad
export const PRIORITY_OPTIONS = [
  { value: "high", label: "Alta", color: "#ef4444" },
  { value: "medium", label: "Media", color: "#f59e0b" },
  { value: "low", label: "Baja", color: "#10b981" },
] as const;

// Opciones de recordatorio
export const REMINDER_OPTIONS = [
  { value: 0, label: "Sin recordatorio" },
  { value: 5, label: "5 minutos antes" },
  { value: 15, label: "15 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "1 día antes" },
] as const;

// Ubicaciones predefinidas
export const LOCATION_OPTIONS = [
  "Casa",
  "Biblioteca",
  "Universidad",
  "Sala de estudio",
  "Cafetería",
  "Online",
  "Otro",
] as const;
