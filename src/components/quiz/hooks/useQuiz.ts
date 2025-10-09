import { useEffect, useCallback } from "react";
import { useQuizData, CuestionarioWithStats } from "./useQuizData";
import { useQuizAttempts, QuizAttempt } from "./useQuizAttempts";
import { useQuizAnswers } from "./useQuizAnswers";
import { QuizAnalysis, QuizDataView, QuizQuestionView } from "@/types/quiz";
import { MainTypes } from "@/utils/api/schema";

type Cuestionario = MainTypes["Cuestionario"]["type"];

export interface UseQuizParams {
  cuestionarioId?: string;
  cursoId?: string;
  usuarioId: string;
  autoLoad?: boolean;
}

export interface UseQuizReturn {
  // Quiz data (single quiz scenario)
  quiz: QuizDataView | null;
  cuestionario: Cuestionario | null;
  questions: QuizQuestionView[];

  // Multiple quizzes (course scenario)
  cuestionarios: CuestionarioWithStats[];

  // Quiz attempts
  attempts: QuizAttempt[];
  currentAttemptNumber: number;

  // User answers
  userAnswers: Record<string, string>;

  // State
  loading: boolean;
  submitting: boolean;
  error: string | null;

  // Actions
  loadQuiz: (cuestionarioId: string) => Promise<void>;
  loadQuizByCourse: (courseId: string) => Promise<void>;
  fetchAttempts: (cuestionarioId: string) => Promise<QuizAttempt[]>;
  fetchAttemptAnswers: (
    progresoCuestionarioId: string
  ) => Promise<Record<string, number>>;
  startQuizAttempt: () => Promise<string>;
  continueAttempt: (progresoCuestionarioId: string) => void;
  clearCurrentAttempt: () => void;
  submitAnswer: (
    questionId: string,
    opcionId: string,
    answerText?: string
  ) => Promise<void>;
  submitQuiz: (answers: Record<string, number>) => Promise<QuizAnalysis>;
  resetQuiz: () => void;
  refetch: () => Promise<void>;
  refreshAttempts: () => Promise<void>;
}

/**
 * Main hook that combines quiz data, attempts, and answers
 */
export const useQuiz = (params: UseQuizParams): UseQuizReturn => {
  const { cuestionarioId, cursoId, usuarioId, autoLoad = true } = params;

  // Use the individual hooks
  const quizData = useQuizData({ autoLoad: false });
  const quizAttempts = useQuizAttempts();
  const quizAnswers = useQuizAnswers();

  // Combined loading state
  const loading = quizData.loading || quizAttempts.loading;
  const error = quizData.error || quizAttempts.error || quizAnswers.error;

  /**
   * Load quiz by cuestionarioId
   */
  const loadQuiz = useCallback(
    async (cuestionarioId: string) => {
      await quizData.loadQuiz(cuestionarioId);
      // Also fetch attempts for this quiz
      if (usuarioId) {
        await quizAttempts.fetchAttempts(cuestionarioId, usuarioId);
      }
    },
    [quizData, quizAttempts, usuarioId]
  );

  /**
   * Load all quizzes for a course
   */
  const loadQuizByCourse = useCallback(
    async (courseId: string) => {
      await quizData.loadQuizByCourse(courseId);
    },
    [quizData]
  );

  /**
   * Fetch all quiz attempts for a user
   */
  const fetchAttempts = useCallback(
    async (quizId: string) => {
      if (!usuarioId) return [];
      return await quizAttempts.fetchAttempts(quizId, usuarioId);
    },
    [quizAttempts, usuarioId]
  );

  /**
   * Fetch answers from a specific quiz attempt
   */
  const fetchAttemptAnswers = useCallback(
    async (progresoCuestionarioId: string) => {
      return await quizAnswers.fetchAttemptAnswers(
        progresoCuestionarioId,
        quizData.questions
      );
    },
    [quizAnswers, quizData.questions]
  );

  /**
   * Start a new quiz attempt
   */
  const startQuizAttempt = useCallback(async () => {
    if (!quizData.cuestionario || !usuarioId) {
      throw new Error("No quiz loaded or user not provided");
    }
    return await quizAttempts.startQuizAttempt(
      quizData.cuestionario.cuestionarioId,
      usuarioId
    );
  }, [quizAttempts, quizData.cuestionario, usuarioId]);

  /**
   * Continue from a previous attempt
   */
  const continueAttempt = useCallback(
    (progresoCuestionarioId: string) => {
      quizAttempts.continueAttempt(progresoCuestionarioId);
    },
    [quizAttempts]
  );

  /**
   * Clear the current attempt ID
   */
  const clearCurrentAttempt = useCallback(() => {
    quizAttempts.clearCurrentAttempt();
  }, [quizAttempts]);

  /**
   * Submit a single answer to a question
   */
  const submitAnswer = useCallback(
    async (questionId: string, opcionId: string, answerText?: string) => {
      await quizAnswers.submitAnswer(
        questionId,
        opcionId,
        answerText,
        quizData.cuestionario?.cuestionarioId,
        usuarioId,
        quizAttempts.currentProgresoCuestionarioId,
        quizData.questions
      );
    },
    [
      quizAnswers,
      quizData.cuestionario,
      usuarioId,
      quizAttempts.currentProgresoCuestionarioId,
      quizData.questions,
    ]
  );

  /**
   * Submit complete quiz and calculate score
   */
  const submitQuiz = useCallback(
    async (answers: Record<string, number>) => {
      const analysis = await quizAnswers.submitQuiz(
        answers,
        quizData.quiz,
        quizData.cuestionario,
        quizAttempts.currentProgresoCuestionarioId
      );

      // Update attempt number after successful submission
      quizAttempts.clearCurrentAttempt();

      return analysis;
    },
    [quizAnswers, quizData.quiz, quizData.cuestionario, quizAttempts]
  );

  /**
   * Reset quiz state
   */
  const resetQuiz = useCallback(() => {
    quizData.resetQuiz();
    quizAttempts.resetAttempts();
    quizAnswers.resetAnswers();
  }, [quizData, quizAttempts, quizAnswers]);

  /**
   * Refetch quiz data
   */
  const refetch = useCallback(async () => {
    if (cuestionarioId) {
      await loadQuiz(cuestionarioId);
    } else if (cursoId) {
      await loadQuizByCourse(cursoId);
    }
  }, [cuestionarioId, cursoId, loadQuiz, loadQuizByCourse]);

  /**
   * Refresh attempts for the current quiz
   */
  const refreshAttempts = useCallback(async () => {
    if (cuestionarioId && usuarioId) {
      await quizAttempts.refreshAttempts(cuestionarioId, usuarioId);
    }
  }, [cuestionarioId, usuarioId, quizAttempts]);

  // Auto-load on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && cuestionarioId) {
      loadQuiz(cuestionarioId);
    } else if (autoLoad && cursoId) {
      loadQuizByCourse(cursoId);
    }
  }, [autoLoad, cuestionarioId, cursoId, loadQuiz, loadQuizByCourse]);

  return {
    // Data
    quiz: quizData.quiz,
    cuestionario: quizData.cuestionario,
    questions: quizData.questions,
    cuestionarios: quizData.cuestionarios,
    attempts: quizAttempts.attempts,
    currentAttemptNumber: quizAttempts.currentAttemptNumber,
    userAnswers: quizAnswers.userAnswers,

    // State
    loading,
    submitting: quizAnswers.submitting,
    error,

    // Actions
    loadQuiz,
    loadQuizByCourse,
    fetchAttempts,
    fetchAttemptAnswers,
    startQuizAttempt,
    continueAttempt,
    clearCurrentAttempt,
    submitAnswer,
    submitQuiz,
    resetQuiz,
    refetch,
    refreshAttempts,
  };
};
