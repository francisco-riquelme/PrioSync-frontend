'use client';

import React from 'react';
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
import { useQuizDetailData } from './hooks/useQuizDetailData';
import { useQuizActions } from './hooks/useQuizActions';
import { useQuizAttempts } from './hooks/useQuizAttempts';
import { useUser } from '@/contexts/UserContext';

export interface QuizProps {
  cuestionarioId?: string;
  cursoId?: string;
}


const Quiz: React.FC<QuizProps> = ({ cuestionarioId, cursoId }) => {
  const { userData } = useUser();
  const usuarioId = userData?.usuarioId || 'user_francisco_riquelme';
  
  // Use the new focused hooks
  const { quiz, preguntas, attempts, loading, error, refetch } = useQuizDetailData({
    cuestionarioId: cuestionarioId || '',
    usuarioId,
  });

  const quizAttempts = useQuizAttempts();

  // Use the new actions hook
  const {
    currentScreen,
    currentQuestionIndex,
    selectedAnswers,
    timeLeft,
    showResults,
    quizAnalysis,
    reviewAttempt,
    reviewAnswers,
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
  } = useQuizActions({
    quiz,
    preguntas,
    usuarioId,
    refetch,
    cursoId,
  });

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
  const currentQuestion = preguntas[currentQuestionIndex] || null;

  // Renderizado condicional
  if (currentScreen === 'instructions') {
    return (
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 66%' } }}>
            <QuizInstructions
              quiz={quiz}
              preguntas={preguntas}
              onStartQuiz={handleStartQuiz}
              onReturnToCourse={handleReturnToCourse}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 34%' } }}>
            <QuizAttemptsTable
              attempts={attempts}
              currentAttemptNumber={quizAttempts.currentAttemptNumber}
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
        preguntas={preguntas}
        attempt={reviewAttempt}
        userAnswers={reviewAnswers}
        onBack={handleBackFromReview}
        onReturnToCourse={handleReturnToCourse}
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
              totalQuestions={preguntas.length}
              percentage={quizAnalysis.percentage}
              passed={quizAnalysis.percentage >= (quiz?.porcentaje_aprobacion || 70)}
              passingScore={quiz?.porcentaje_aprobacion || 70}
              onRetry={handleRetryQuiz}
              onViewRecommendations={handleViewRecommendations}
              onReturnToCourse={handleReturnToCourse}
              showRecommendationsButton={quizAnalysis.percentage < 75 || quizAnalysis.recommendations.length > 0}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 34%' } }}>
            <QuizAttemptsTable
              attempts={attempts}
              currentAttemptNumber={quizAttempts.currentAttemptNumber}
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
        totalTime={quiz?.duracion_minutos || 30}
        onTimeUp={handleFinishQuiz}
        isActive={currentScreen === 'quiz' && !showResults}
        onTick={setTimeLeft}
      />

      {/* Pregunta actual */}
      <Box sx={{ mb: 4 }}>
        {currentQuestion && (
          <QuizQuestion
            pregunta={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={preguntas.length}
            selectedAnswer={selectedAnswers[currentQuestion.preguntaId]}
            onAnswerSelect={handleAnswerSelect}
          />
        )}
      </Box>

      {/* Navegación */}
      <QuizNavigation
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={preguntas.length}
        selectedAnswers={selectedAnswers}
        currentQuestionId={currentQuestion?.preguntaId || ''}
        onPrevious={handlePreviousQuestion}
        onNext={handleNextQuestion}
        onFinish={handleFinishQuiz}
      />
    </Box>
  );
};

export default Quiz;
