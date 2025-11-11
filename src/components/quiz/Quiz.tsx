'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
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
import { useUser } from '@/contexts/UserContext';

export interface QuizProps {
  cuestionarioId?: string;
  cursoId?: string;
}


const Quiz: React.FC<QuizProps> = ({ cuestionarioId, cursoId }) => {
  const { userData } = useUser();
  const usuarioId = userData?.usuarioId;

  if (!usuarioId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6" color="text.secondary">
          Por favor inicia sesión para acceder a los cuestionarios
        </Typography>
      </Box>
    );
  }

  return (
    <QuizContent usuarioId={usuarioId} cuestionarioId={cuestionarioId || ''} cursoId={cursoId} />
  );
};

interface QuizContentProps {
  usuarioId: string;
  cuestionarioId: string;
  cursoId?: string;
}

const QuizContent: React.FC<QuizContentProps> = ({ usuarioId, cuestionarioId, cursoId }) => {
  const { quiz, preguntas, attempts, loading, error, refetch } = useQuizDetailData({
    cuestionarioId,
    usuarioId,
  });

  const {
    currentScreen,
    currentQuestionIndex,
    selectedAnswers,
    timeLeft,
    showResults,
    quizAnalysis,
    completedProgresoCuestionarioId,
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
    handleContinueAttempt,
    handleReviewAttempt,
    handleReviewCurrentAttempt,
    handleViewRecommendationsFromAttempt,
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Cargando cuestionario...</div>
      </Box>
    );
  }

  if (error || !quiz) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>{error || "No se pudo cargar el cuestionario"}</div>
      </Box>
    );
  }

  const currentQuestion = preguntas[currentQuestionIndex] || null;

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
              onContinueAttempt={handleContinueAttempt}
              onReviewAttempt={handleReviewAttempt}
              onViewRecommendations={handleViewRecommendationsFromAttempt}
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
        onReturnToCourse={handleReturnToCourse}
        progresoCuestionarioId={completedProgresoCuestionarioId || undefined}
        cuestionarioId={cuestionarioId}
        usuarioId={usuarioId}
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
              totalQuestions={quizAnalysis.totalQuestions}
              totalPoints={quizAnalysis.totalPoints}
              correctCount={quizAnalysis.correctCount}
              percentage={quizAnalysis.percentage}
              passed={quizAnalysis.percentage >= (quiz?.porcentaje_aprobacion || 70)}
              passingScore={quiz?.porcentaje_aprobacion || 70}
              onRetry={handleRetryQuiz}
              onReviewAnswers={handleReviewCurrentAttempt}
              onViewRecommendations={handleViewRecommendations}
              onReturnToCourse={handleReturnToCourse}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 34%' } }}>
            <QuizAttemptsTable
              attempts={attempts}
              onContinueAttempt={handleContinueAttempt}
              onReviewAttempt={handleReviewAttempt}
              onViewRecommendations={handleViewRecommendationsFromAttempt}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <QuizTimer
        timeLeft={timeLeft}
        totalTime={quiz?.duracion_minutos || 30}
        onTimeUp={handleFinishQuiz}
        isActive={currentScreen === 'quiz' && !showResults}
        onTick={setTimeLeft}
      />

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
