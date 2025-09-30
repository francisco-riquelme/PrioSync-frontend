// Tipos de componente para Quiz (estado y UI)
import { QuizAnalysis } from "@/types/quiz";

export type QuizScreen =
  | "instructions"
  | "quiz"
  | "results"
  | "recommendations";

export interface QuizState {
  currentScreen: QuizScreen;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, number>;
  timeLeft: number;
  showResults: boolean;
  quizAnalysis: QuizAnalysis | null;
}
