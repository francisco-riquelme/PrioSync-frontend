// Main Quiz component
export { default as Quiz } from "./Quiz";
export type { QuizProps } from "./Quiz";

// Sub-components
export { default as QuizInstructions } from "./QuizInstructions";
export { default as QuizQuestion } from "./QuizQuestion";
export { default as QuizTimer } from "./QuizTimer";
export { default as QuizResults } from "./QuizResults";
export { default as QuizRecommendations } from "./QuizRecommendations";
export { default as QuizNavigation } from "./QuizNavigation";
export { default as QuizAttemptsTable } from "./QuizAttemptsTable";

// Exports de hooks
export { useQuiz } from "./hooks/useQuiz";
export type {
  UseQuizReturn,
  UseQuizParams,
  QuizAnswer,
  QuizAttempt,
  CuestionarioWithStats,
} from "./hooks/useQuiz";

// Exports de tipos de dominio
export type {
  QuizQuestionView as QuizQuestionType,
  QuizData,
  QuizDataView,
  StudyRecommendation,
  QuizAnalysis,
} from "@/types/quiz";

// Exports de tipos de componente
export type { QuizScreen, QuizState } from "./types";
