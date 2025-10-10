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
export { useQuizDetailData } from "./hooks/useQuizDetailData";
export { useQuizActions } from "./hooks/useQuizActions";
export type {
  UseQuizDetailDataReturn,
  UseQuizDetailDataParams,
  CuestionarioWithQuestions,
  PreguntaFromCuestionario,
  OpcionFromPregunta,
  QuizAttemptWithAnswers,
} from "./hooks/useQuizDetailData";
export type {
  UseQuizActionsParams,
  UseQuizActionsReturn,
} from "./hooks/useQuizActions";

export type { QuizAttempt } from "./hooks/useQuizAttempts";

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
