// Tipos específicos para componentes del calendario
import { StudySession } from "@/types/studySession";

// Formulario simplificado para el calendario (solo fecha y hora)
export interface CalendarStudySessionFormData {
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  cursoId?: string; // NEW: Optional course ID
  leccionId?: string; // NEW: Optional lesson ID
}

// Evento para el calendario (BigCalendar)
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  session: StudySession;
}

// Props para componentes
export interface StudySessionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (sessionData: CalendarStudySessionFormData) => Promise<boolean>;
  editingSession?: StudySession | null;
  selectedSlot?: {
    start: Date;
    end: Date;
    slots: Date[];
    action: string;
  } | null;
}

export interface StudySessionDetailsProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  session: StudySession | null;
}

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: StudySession | null;
  loading?: boolean;
}

export interface CalendarToolbarProps {
  label: string;
  onNavigate: (action: string) => void;
  onView: (view: "month" | "week" | "day") => void;
  currentView: "month" | "week" | "day";
}
