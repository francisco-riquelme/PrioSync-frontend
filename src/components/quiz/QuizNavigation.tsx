'use client';

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material';

interface QuizNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswers: Record<string, number>;
  currentQuestionId: string;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentQuestionIndex,
  totalQuestions,
  selectedAnswers,
  currentQuestionId,
  onPrevious,
  onNext,
  onFinish
}) => {
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isCurrentQuestionAnswered = selectedAnswers[currentQuestionId] !== undefined;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  return (
    <Box>
      {/* Barra de progreso */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progreso del Quiz
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {answeredCount} de {totalQuestions} respondidas
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            }
          }}
        />
        
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
        >
          {Math.round(progress)}% completado
        </Typography>
      </Box>

      {/* Botones de navegación */}
      <Stack 
        direction="row" 
        spacing={2} 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ mt: 4 }}
      >
        {/* Botón Anterior */}
        <Button
          startIcon={<ArrowBack />}
          onClick={onPrevious}
          disabled={isFirstQuestion}
          variant="outlined"
          size="large"
        >
          Anterior
        </Button>

        {/* Estado central */}
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Pregunta {currentQuestionIndex + 1} de {totalQuestions}
          </Typography>
          
          {isCurrentQuestionAnswered && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                Respondida
              </Typography>
            </Box>
          )}
          
          {!isCurrentQuestionAnswered && (
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
              Selecciona una respuesta para continuar
            </Typography>
          )}
        </Box>

        {/* Botón Siguiente/Finalizar */}
        {isLastQuestion ? (
          <Button
            variant="contained"
            onClick={onFinish}
            disabled={!isCurrentQuestionAnswered}
            color="success"
            size="large"
            startIcon={<CheckCircle />}
            sx={{ minWidth: 140 }}
          >
            Finalizar Quiz
          </Button>
        ) : (
          <Button
            endIcon={<ArrowForward />}
            onClick={onNext}
            disabled={!isCurrentQuestionAnswered}
            variant="contained"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Siguiente
          </Button>
        )}
      </Stack>

      {/* Indicador de preguntas por responder */}
      {answeredCount < totalQuestions && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Te faltan <strong>{totalQuestions - answeredCount} preguntas</strong> por responder
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default QuizNavigation;