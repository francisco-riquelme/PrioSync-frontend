"use client";

import { useState, useEffect, useCallback } from "react";
import { QuizScreen } from "../types";
import { QuizAnalysis, StudyRecommendation, QuizDataView } from "@/types/quiz";
import { MainTypes } from "@/utils/api/schema";
import {
  CuestionarioWithQuestions,
  PreguntaFromCuestionario,
  QuizAttemptWithAnswers,
} from "./useQuizDetailData";
import { useQuizAttempts } from "./useQuizAttempts";
import { useQuizAnswers } from "./useQuizAnswers";

type Cuestionario = MainTypes["Cuestionario"]["type"];

export interface UseQuizActionsParams {
  quiz: CuestionarioWithQuestions | null;
  preguntas: PreguntaFromCuestionario[];
  usuarioId: string;
  refetch: () => Promise<void>;
  cursoId?: string;
}

export interface UseQuizActionsReturn {
  // State
  currentScreen: QuizScreen;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, number>;
  timeLeft: number;
  showResults: boolean;
  quizAnalysis: QuizAnalysis | null;
  reviewAttempt: QuizAttemptWithAnswers | null;
  reviewAnswers: Record<string, number>;

  // Actions
  handleStartQuiz: () => Promise<void>;
  handleAnswerSelect: (
    preguntaId: string,
    answerIndex: number
  ) => Promise<void>;
  handlePreviousQuestion: () => void;
  handleNextQuestion: () => void;
  handleFinishQuiz: () => Promise<void>;
  handleRetryQuiz: () => void;
  handleViewRecommendations: () => void;
  handleBackToResults: () => void;
  handleRecommendationAction: (recommendation: StudyRecommendation) => void;
  handleContinueAttempt: (attempt: QuizAttemptWithAnswers) => Promise<void>;
  handleReviewAttempt: (attempt: QuizAttemptWithAnswers) => Promise<void>;
  handleBackFromReview: () => void;
  handleReturnToCourse: () => void;
  setTimeLeft: (time: number) => void;
}

/**
 * Hook for managing quiz actions and state
 * Encapsulates all quiz interaction logic
 */
export const useQuizActions = ({
  quiz,
  preguntas,
  usuarioId,
  refetch,
  cursoId,
}: UseQuizActionsParams): UseQuizActionsReturn => {
  const quizAttempts = useQuizAttempts();
  const quizAnswers = useQuizAnswers();

  // Quiz state
  const [currentScreen, setCurrentScreen] =
    useState<QuizScreen>("instructions");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysis | null>(null);
  const [reviewAttempt, setReviewAttempt] =
    useState<QuizAttemptWithAnswers | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, number>>(
    {}
  );

  // Initialize timer when quiz loads
  useEffect(() => {
    if (quiz) {
      setTimeLeft((quiz.duracion_minutos || 30) * 60);
    }
  }, [quiz]);

  // Define handleFinishQuiz before it's used in useEffect
  const handleFinishQuiz = useCallback(async () => {
    if (!quiz) return;

    try {
      // Transform quiz data for submission
      const quizDataView: QuizDataView = {
        id: quiz.cuestionarioId,
        courseId: quiz.cursoId || "",
        courseName: "Curso",
        title: quiz.titulo,
        description: quiz.descripcion || "",
        timeLimit: quiz.duracion_minutos || 30,
        questions: preguntas.map((pregunta) => ({
          id: pregunta.preguntaId,
          question: pregunta.texto_pregunta,
          options: (pregunta.Opciones || [])
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            .map((opcion) => opcion.texto),
          correctAnswer: (pregunta.Opciones || []).findIndex(
            (opcion) => opcion.es_correcta
          ),
          explanation: pregunta.explicacion || undefined,
          peso_puntos: pregunta.peso_puntos || 1,
          opcionIds: (pregunta.Opciones || [])
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
            .map((opcion) => opcion.opcionId),
        })),
        passingScore: quiz.porcentaje_aprobacion || 70,
      };

      // Submit quiz and get analysis
      const analysis = await quizAnswers.submitQuiz(
        selectedAnswers,
        quizDataView,
        quiz as unknown as Cuestionario, // Double cast to handle type incompatibility
        quizAttempts.currentProgresoCuestionarioId
      );
      setQuizAnalysis(analysis);
      setShowResults(true);

      // Refresh attempts to show the completed quiz
      await refetch();
    } catch (err) {
      console.error("Error finishing quiz:", err);
      alert("Error al finalizar el cuestionario");
    }
  }, [
    quiz,
    preguntas,
    selectedAnswers,
    quizAnswers,
    quizAttempts.currentProgresoCuestionarioId,
    refetch,
  ]);

  // Timer effect
  useEffect(() => {
    if (currentScreen !== "quiz" || showResults) return;

    if (timeLeft <= 0) {
      handleFinishQuiz();
    }
  }, [currentScreen, showResults, timeLeft, handleFinishQuiz]);

  // Navigation actions
  const handleStartQuiz = useCallback(async () => {
    try {
      // Start a new quiz attempt
      await quizAttempts.startQuizAttempt(
        quiz?.cuestionarioId || "",
        usuarioId
      );

      // Set screen and timer
      setCurrentScreen("quiz");
      if (quiz) {
        setTimeLeft((quiz.duracion_minutos || 30) * 60);
      }
    } catch (err) {
      console.error("Error starting quiz attempt:", err);
      alert("Error al iniciar el cuestionario. Por favor, intenta nuevamente.");
    }
  }, [quiz, usuarioId, quizAttempts]);

  const handleAnswerSelect = useCallback(
    async (preguntaId: string, answerIndex: number) => {
      // Update local state first for immediate UI feedback
      const updatedAnswers = {
        ...selectedAnswers,
        [preguntaId]: answerIndex,
      };
      setSelectedAnswers(updatedAnswers);

      // Get the question to find the opcionId
      const pregunta = preguntas.find((p) => p.preguntaId === preguntaId);
      if (pregunta && pregunta.Opciones && pregunta.Opciones[answerIndex]) {
        const sortedOpciones = [...pregunta.Opciones].sort(
          (a, b) => (a.orden || 0) - (b.orden || 0)
        );
        const opcionId = sortedOpciones[answerIndex].opcionId;

        try {
          // Save answer to database (creates or updates)
          await quizAnswers.submitAnswer(
            preguntaId,
            opcionId,
            undefined, // answerText
            quiz?.cuestionarioId,
            usuarioId,
            quizAttempts.currentProgresoCuestionarioId,
            preguntas.map((p) => ({
              id: p.preguntaId,
              question: p.texto_pregunta,
              options: (p.Opciones || [])
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map((opcion) => opcion.texto),
              correctAnswer: (p.Opciones || []).findIndex(
                (opcion) => opcion.es_correcta
              ),
              explanation: p.explicacion || undefined,
              peso_puntos: p.peso_puntos || 1,
              opcionIds: (p.Opciones || [])
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map((opcion) => opcion.opcionId),
            }))
          );

          // Check if all questions are now answered
          const allQuestionsAnswered = preguntas.every(
            (p) => updatedAnswers[p.preguntaId] !== undefined
          );

          // If all questions answered, automatically finish the quiz
          if (allQuestionsAnswered) {
            // Small delay for better UX (user sees their last selection)
            setTimeout(async () => {
              await handleFinishQuiz();
            }, 500);
          }
        } catch (err) {
          console.error("Error saving answer:", err);
          // Don't block the user from continuing even if save fails
        }
      }
    },
    [
      selectedAnswers,
      preguntas,
      quiz,
      usuarioId,
      quizAttempts.currentProgresoCuestionarioId,
      quizAnswers,
      handleFinishQuiz,
    ]
  );

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleNextQuestion = useCallback(() => {
    if (preguntas && currentQuestionIndex < preguntas.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [preguntas, currentQuestionIndex]);

  const handleRetryQuiz = useCallback(() => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setCurrentScreen("instructions");
    if (quiz) {
      setTimeLeft((quiz.duracion_minutos || 30) * 60);
    }
    setQuizAnalysis(null);
    // Clear the current attempt ID so a new one is created
    quizAttempts.clearCurrentAttempt();
  }, [quiz, quizAttempts]);

  // Screen management actions
  const handleViewRecommendations = useCallback(() => {
    setCurrentScreen("recommendations");
  }, []);

  const handleBackToResults = useCallback(() => {
    setCurrentScreen("quiz");
    setShowResults(true);
  }, []);

  const handleRecommendationAction = useCallback(
    (recommendation: StudyRecommendation) => {
      console.log("Recommendation action:", recommendation);
      if (recommendation.action.type === "navigate") {
        window.location.href = recommendation.action.target;
      }
    },
    []
  );

  // Attempt management actions
  const handleContinueAttempt = useCallback(
    async (attempt: QuizAttemptWithAnswers) => {
      try {
        // Set the current attempt ID in the hook
        quizAttempts.continueAttempt(attempt.progresoCuestionarioId);

        // Fetch the answers from the previous attempt
        const previousAnswers = await quizAnswers.fetchAttemptAnswers(
          attempt.progresoCuestionarioId,
          preguntas.map((p) => ({
            id: p.preguntaId,
            question: p.texto_pregunta,
            options: (p.Opciones || [])
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((opcion) => opcion.texto),
            correctAnswer: (p.Opciones || []).findIndex(
              (opcion) => opcion.es_correcta
            ),
            explanation: p.explicacion || undefined,
            peso_puntos: p.peso_puntos || 1,
            opcionIds: (p.Opciones || [])
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((opcion) => opcion.opcionId),
          }))
        );

        // Load the answers into state
        setSelectedAnswers(previousAnswers);

        // Determine where to continue from
        let continueFromIndex = 0; // Default to first question

        // If quiz has randomized questions, always start from the beginning
        if (quiz?.preguntas_aleatorias) {
          continueFromIndex = 0;
        } else if (
          preguntas &&
          attempt.ultima_pregunta_respondida !== null &&
          attempt.ultima_pregunta_respondida !== undefined
        ) {
          // For non-randomized quizzes, continue from the next question after the last answered one
          const nextIndex = attempt.ultima_pregunta_respondida + 1;

          // Make sure we don't go beyond the last question
          continueFromIndex =
            nextIndex < preguntas.length
              ? nextIndex
              : attempt.ultima_pregunta_respondida;
        }

        setCurrentQuestionIndex(continueFromIndex);
        setCurrentScreen("quiz");
        setShowResults(false);

        // Reset timer
        if (quiz) {
          setTimeLeft((quiz.duracion_minutos || 30) * 60);
        }
      } catch (err) {
        console.error("Error continuing attempt:", err);
        alert("Error al cargar el intento anterior");
      }
    },
    [quiz, preguntas, quizAttempts, quizAnswers]
  );

  const handleReviewAttempt = useCallback(
    async (attempt: QuizAttemptWithAnswers) => {
      try {
        // Fetch the answers from the attempt
        const attemptAnswers = await quizAnswers.fetchAttemptAnswers(
          attempt.progresoCuestionarioId,
          preguntas.map((p) => ({
            id: p.preguntaId,
            question: p.texto_pregunta,
            options: (p.Opciones || [])
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((opcion) => opcion.texto),
            correctAnswer: (p.Opciones || []).findIndex(
              (opcion) => opcion.es_correcta
            ),
            explanation: p.explicacion || undefined,
            peso_puntos: p.peso_puntos || 1,
            opcionIds: (p.Opciones || [])
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((opcion) => opcion.opcionId),
          }))
        );

        // Set review state
        setReviewAttempt(attempt);
        setReviewAnswers(attemptAnswers);
        setCurrentScreen("review");
      } catch (err) {
        console.error("Error loading attempt for review:", err);
        alert("Error al cargar el intento para revisión");
      }
    },
    [preguntas, quizAnswers]
  );

  const handleBackFromReview = useCallback(() => {
    setCurrentScreen("instructions");
    setReviewAttempt(null);
    setReviewAnswers({});
  }, []);

  const handleReturnToCourse = useCallback(() => {
    // Navigate back to the course using the cursoId from props or quiz data
    const courseId = cursoId || quiz?.cursoId;
    if (courseId) {
      // Navigate to the course detail page
      window.location.href = `/courses/${courseId}`;
    } else {
      // Fallback to courses list if no course ID available
      window.location.href = "/courses";
    }
  }, [cursoId, quiz?.cursoId]);

  return {
    // State
    currentScreen,
    currentQuestionIndex,
    selectedAnswers,
    timeLeft,
    showResults,
    quizAnalysis,
    reviewAttempt,
    reviewAnswers,

    // Actions
    handleStartQuiz,
    handleAnswerSelect,
    handlePreviousQuestion,
    handleNextQuestion,
    handleFinishQuiz,
    handleRetryQuiz,
    handleViewRecommendations,
    handleBackToResults,
    handleRecommendationAction,
    handleContinueAttempt,
    handleReviewAttempt,
    handleBackFromReview,
    handleReturnToCourse,
    setTimeLeft,
  };
};
