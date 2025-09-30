// Exports de componentes del Quiz
export { default as QuizInstructions } from "./QuizInstructions";
export { default as QuizQuestion } from "./QuizQuestion";
export { default as QuizTimer } from "./QuizTimer";
export { default as QuizResults } from "./QuizResults";
export { default as QuizRecommendations } from "./QuizRecommendations";
export { default as QuizNavigation } from "./QuizNavigation";

// Exports de tipos de dominio
export type {
  QuizQuestion as QuizQuestionType,
  QuizData,
  StudyRecommendation,
  QuizAnalysis,
} from "@/types/quiz";

// Exports de tipos de componente
export type { QuizScreen, QuizState } from "./types";
