'use client';

import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@mui/material';
import {
  QuizInstructions,
  QuizQuestion,
  QuizTimer,
  QuizResults,
  QuizRecommendations,
  QuizNavigation,
} from './';
import QuizAttemptsTable from './QuizAttemptsTable';
import QuizReview from './QuizReview';
import { useQuiz } from './hooks/useQuiz';
import { useUser } from '@/contexts/UserContext';
import { QuizAnalysis, StudyRecommendation } from '@/types/quiz';
import { QuizScreen } from './types';
import { QuizAttempt } from './hooks/useQuiz';

export interface QuizProps {
  cuestionarioId?: string;
  cursoId?: string;
}

const Quiz: React.FC<QuizProps> = ({ cuestionarioId, cursoId }) => {
  const { userData } = useUser();
  const usuarioId = userData?.usuarioId || 'user_francisco_riquelme';
  
  // Use the custom hook to fetch quiz data
  const {
    quiz,
    cuestionario,
    loading,
    error,
    submitQuiz,
    submitAnswer,
    continueAttempt,
    clearCurrentAttempt,
    attempts,
    currentAttemptNumber,
    fetchAttemptAnswers,
    refreshAttempts,
  } = useQuiz({
    cuestionarioId,
    cursoId,
    usuarioId,
    autoLoad: true,
  });

  // Estados principales
  const [currentScreen, setCurrentScreen] = useState<QuizScreen>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysis | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<QuizAttempt | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, number>>({});

  // Initialize timer when quiz loads
  useEffect(() => {
    if (quiz) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz]);

  // Timer effect
  useEffect(() => {
    if (currentScreen !== 'quiz' || showResults) return;

    if (timeLeft <= 0) {
      handleFinishQuiz();
    }
  }, [currentScreen, showResults, timeLeft]);

  // Funciones de navegación
  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
    if (quiz) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  };

  const handleAnswerSelect = async (questionId: string, answerIndex: number) => {
    // Update local state first for immediate UI feedback
    const updatedAnswers = {
      ...selectedAnswers,
      [questionId]: answerIndex
    };
    setSelectedAnswers(updatedAnswers);

    // Get the question to find the opcionId
    if (quiz) {
      const question = quiz.questions.find(q => q.id === questionId);
      if (question && question.opcionIds && question.opcionIds[answerIndex]) {
        const opcionId = question.opcionIds[answerIndex];
        
        try {
          // Save answer to database (creates or updates)
          await submitAnswer(questionId, opcionId);
          
          // Check if all questions are now answered
          const allQuestionsAnswered = quiz.questions.every(
            q => updatedAnswers[q.id] !== undefined
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
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleFinishQuiz = async () => {
    if (!quiz) return;

    try {
      // Submit quiz and get analysis
      const analysis = await submitQuiz(selectedAnswers);
      setQuizAnalysis(analysis);
      setShowResults(true);
      
      // Refresh attempts to show the completed quiz
      await refreshAttempts();
    } catch (err) {
      console.error("Error finishing quiz:", err);
      alert("Error al finalizar el cuestionario");
    }
  };

  const handleRetryQuiz = () => {
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setCurrentScreen('instructions');
    if (quiz) {
      setTimeLeft(quiz.timeLimit * 60);
    }
    setQuizAnalysis(null);
    // Clear the current attempt ID so a new one is created
    clearCurrentAttempt();
  };

  const handleViewRecommendations = () => {
    setCurrentScreen('recommendations');
  };

  const handleBackToResults = () => {
    setCurrentScreen('quiz');
    setShowResults(true);
  };

  const handleRecommendationAction = (recommendation: StudyRecommendation) => {
    console.log('Recommendation action:', recommendation);
    if (recommendation.action.type === 'navigate') {
      window.location.href = recommendation.action.target;
    }
  };

  const handleContinueAttempt = async (attempt: QuizAttempt) => {
    try {
      // Set the current attempt ID in the hook
      continueAttempt(attempt.progresoCuestionarioId);
      
      // Fetch the answers from the previous attempt
      const previousAnswers = await fetchAttemptAnswers(attempt.progresoCuestionarioId);
      
      // Load the answers into state
      setSelectedAnswers(previousAnswers);
      
      // Determine where to continue from
      let continueFromIndex = 0; // Default to first question
      
      // If quiz has randomized questions, always start from the beginning
      if (cuestionario?.preguntas_aleatorias) {
        continueFromIndex = 0;
      } else if (quiz && attempt.ultima_pregunta_respondida !== null && 
                 attempt.ultima_pregunta_respondida !== undefined) {
        // For non-randomized quizzes, continue from the next question after the last answered one
        const nextIndex = attempt.ultima_pregunta_respondida + 1;
        
        // Make sure we don't go beyond the last question
        continueFromIndex = nextIndex < quiz.questions.length 
          ? nextIndex 
          : attempt.ultima_pregunta_respondida;
      }
      
      setCurrentQuestionIndex(continueFromIndex);
      setCurrentScreen('quiz');
      setShowResults(false);
      
      // Reset timer
      if (quiz) {
        setTimeLeft(quiz.timeLimit * 60);
      }
    } catch (err) {
      console.error("Error continuing attempt:", err);
      alert("Error al cargar el intento anterior");
    }
  };

  const handleReviewAttempt = async (attempt: QuizAttempt) => {
    try {
      // Fetch the answers from the attempt
      const attemptAnswers = await fetchAttemptAnswers(attempt.progresoCuestionarioId);
      
      // Set review state
      setReviewAttempt(attempt);
      setReviewAnswers(attemptAnswers);
      setCurrentScreen('review');
    } catch (err) {
      console.error("Error loading attempt for review:", err);
      alert("Error al cargar el intento para revisión");
    }
  };

  const handleBackFromReview = () => {
    setCurrentScreen('instructions');
    setReviewAttempt(null);
    setReviewAnswers({});
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Cargando cuestionario...</div>
      </Box>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>{error || "No se pudo cargar el cuestionario"}</div>
      </Box>
    );
  }

  // Datos calculados
  const currentQuestion = quiz.questions[currentQuestionIndex];

  // Renderizado condicional
  if (currentScreen === 'instructions') {
    return (
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 66%' } }}>
            <QuizInstructions
              quizData={quiz}
              onStartQuiz={handleStartQuiz}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 34%' } }}>
            <QuizAttemptsTable
              attempts={attempts}
              currentAttemptNumber={currentAttemptNumber}
              onContinueAttempt={handleContinueAttempt}
              onReviewAttempt={handleReviewAttempt}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  if (currentScreen === 'review' && reviewAttempt) {
    return (
      <QuizReview
        quiz={quiz}
        attempt={reviewAttempt}
        userAnswers={reviewAnswers}
        onBack={handleBackFromReview}
      />
    );
  }

  if (currentScreen === 'recommendations' && quizAnalysis) {
    return (
      <QuizRecommendations
        analysis={quizAnalysis}
        onBackToResults={handleBackToResults}
        onActionClick={handleRecommendationAction}
      />
    );
  }

  if (showResults && quizAnalysis) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 66%' } }}>
            <QuizResults
              score={quizAnalysis.score}
              totalQuestions={quiz.questions.length}
              percentage={quizAnalysis.percentage}
              passed={quizAnalysis.percentage >= quiz.passingScore}
              passingScore={quiz.passingScore}
              onRetry={handleRetryQuiz}
              onViewRecommendations={handleViewRecommendations}
              showRecommendationsButton={quizAnalysis.percentage < 75 || quizAnalysis.recommendations.length > 0}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 34%' } }}>
            <QuizAttemptsTable
              attempts={attempts}
              currentAttemptNumber={currentAttemptNumber}
              onContinueAttempt={handleContinueAttempt}
              onReviewAttempt={handleReviewAttempt}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  // Vista del quiz principal
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Timer */}
      <QuizTimer
        timeLeft={timeLeft}
        totalTime={quiz.timeLimit}
        onTimeUp={handleFinishQuiz}
        isActive={currentScreen === 'quiz' && !showResults}
        onTick={setTimeLeft}
      />

      {/* Pregunta actual */}
      <Box sx={{ mb: 4 }}>
        <QuizQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={quiz.questions.length}
          selectedAnswer={selectedAnswers[currentQuestion.id]}
          onAnswerSelect={handleAnswerSelect}
        />
      </Box>

      {/* Navegación */}
      <QuizNavigation
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={quiz.questions.length}
        selectedAnswers={selectedAnswers}
        currentQuestionId={currentQuestion.id}
        onPrevious={handlePreviousQuestion}
        onNext={handleNextQuestion}
        onFinish={handleFinishQuiz}
      />
    </Box>
  );
};

export default Quiz;
