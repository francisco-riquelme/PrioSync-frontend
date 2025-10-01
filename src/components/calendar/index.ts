// Barrel exports for calendar components
export { default as Calendar } from "./Calendar";
export { default as CalendarToolbar } from "./CalendarToolbar";
export { default as StudySessionForm } from "./StudySessionForm";
export { default as StudySessionDetails } from "./StudySessionDetails";
export { default as ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

// Export domain types from types folder
export type {
  StudySession,
  StudySessionFormData,
  StudySessionFilters,
} from "@/types/studySession";

// Export component-specific types
export type {
  CalendarEvent,
  CalendarStudySessionFormData,
  StudySessionFormProps,
  StudySessionDetailsProps,
  ConfirmDeleteDialogProps,
  CalendarToolbarProps,
} from "./componentTypes";
