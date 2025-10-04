'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import { 
  Quiz as QuizIcon, 
  CheckCircle, 
  Cancel,
  ArrowBack 
} from '@mui/icons-material';
import { QuizQuestionView, QuizDataView } from '@/types/quiz';
import { QuizAttempt } from './hooks/useQuiz';

interface QuizReviewProps {
  quiz: QuizDataView;
  attempt: QuizAttempt;
  userAnswers: Record<string, number>;
  onBack: () => void;
}

const QuizReview: React.FC<QuizReviewProps> = ({
  quiz,
  attempt,
  userAnswers,
  onBack,
}) => {
  const getAnswerColor = (question: QuizQuestionView, optionIndex: number) => {
    const userAnswer = userAnswers[question.id];
    const isCorrectAnswer = optionIndex === question.correctAnswer;
    const isUserAnswer = optionIndex === userAnswer;

    if (isCorrectAnswer && isUserAnswer) {
      return 'success'; // User got it right
    } else if (isCorrectAnswer && !isUserAnswer) {
      return 'info'; // Correct answer that user didn't select
    } else if (isUserAnswer && !isCorrectAnswer) {
      return 'error'; // User's wrong answer
    } else {
      return 'default'; // Other options
    }
  };

  const getAnswerIcon = (question: QuizQuestionView, optionIndex: number) => {
    const userAnswer = userAnswers[question.id];
    const isCorrectAnswer = optionIndex === question.correctAnswer;
    const isUserAnswer = optionIndex === userAnswer;

    if (isCorrectAnswer && isUserAnswer) {
      return <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />;
    } else if (isCorrectAnswer && !isUserAnswer) {
      return <CheckCircle sx={{ fontSize: 16, color: 'info.main' }} />;
    } else if (isUserAnswer && !isCorrectAnswer) {
      return <Cancel sx={{ fontSize: 16, color: 'error.main' }} />;
    } else {
      return null;
    }
  };

  const getAnswerLabel = (question: QuizQuestionView, optionIndex: number) => {
    const userAnswer = userAnswers[question.id];
    const isCorrectAnswer = optionIndex === question.correctAnswer;
    const isUserAnswer = optionIndex === userAnswer;

    if (isCorrectAnswer && isUserAnswer) {
      return 'Tu respuesta correcta';
    } else if (isCorrectAnswer && !isUserAnswer) {
      return 'Respuesta correcta';
    } else if (isUserAnswer && !isCorrectAnswer) {
      return 'Tu respuesta incorrecta';
    } else {
      return '';
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          variant="outlined"
          color="primary"
        >
          Volver
        </Button>
        <QuizIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Revisión del Cuestionario
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Intento #{attempt.intento_numero} - {attempt.fecha_completado ? 
              new Date(attempt.fecha_completado).toLocaleDateString('es-ES') : 'N/A'}
          </Typography>
        </Box>
        <Chip
          label={`${attempt.puntaje_obtenido || 0} pts`}
          color={attempt.aprobado ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      {/* Questions */}
      <Stack spacing={4}>
        {quiz.questions.map((question, questionIndex) => (
          <Paper key={question.id} elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            {/* Question Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Pregunta {questionIndex + 1} de {quiz.questions.length}
              </Typography>
              <Chip
                label={userAnswers[question.id] === question.correctAnswer ? 'Correcta' : 'Incorrecta'}
                color={userAnswers[question.id] === question.correctAnswer ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Question Text */}
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 500, 
                lineHeight: 1.4,
                color: 'text.primary',
                mb: 3
              }}
            >
              {question.question}
            </Typography>

            {/* Options */}
            <FormControl fullWidth>
              <Stack spacing={1}>
                {question.options.map((option: string, optionIndex: number) => {
                  const color = getAnswerColor(question, optionIndex);
                  const icon = getAnswerIcon(question, optionIndex);
                  const label = getAnswerLabel(question, optionIndex);

                  return (
                    <Paper
                      key={optionIndex}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `2px solid`,
                        borderColor: 
                          color === 'success' ? 'success.main' :
                          color === 'error' ? 'error.main' :
                          color === 'info' ? 'info.main' : 'grey.300',
                        bgcolor: 
                          color === 'success' ? 'success.50' :
                          color === 'error' ? 'error.50' :
                          color === 'info' ? 'info.50' : 'transparent',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {icon}
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: color !== 'default' ? 600 : 400,
                            color: 
                              color === 'success' ? 'success.main' :
                              color === 'error' ? 'error.main' :
                              color === 'info' ? 'info.main' : 'text.primary',
                            flex: 1
                          }}
                        >
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Typography>
                        {label && (
                          <Chip
                            label={label}
                            color={color}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            </FormControl>

            {/* Explanation */}
            {question.explanation && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                  💡 Explicación: {question.explanation}
                </Typography>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      {/* Summary */}
      <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Resumen del Intento
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Chip
            label={`Puntaje: ${attempt.puntaje_obtenido || 0} pts`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={attempt.aprobado ? 'Aprobado' : 'No Aprobado'}
            color={attempt.aprobado ? 'success' : 'error'}
            variant="outlined"
          />
          <Chip
            label={`Correctas: ${quiz.questions.filter(q => userAnswers[q.id] === q.correctAnswer).length}/${quiz.questions.length}`}
            color="info"
            variant="outlined"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default QuizReview;
