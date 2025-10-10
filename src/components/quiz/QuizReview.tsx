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
import { PreguntaFromCuestionario, QuizAttemptWithAnswers } from './hooks/useQuizDetailData';

interface QuizReviewProps {
  preguntas: PreguntaFromCuestionario[];
  attempt: QuizAttemptWithAnswers;
  userAnswers: Record<string, number>;
  onBack: () => void;
  onReturnToCourse?: () => void;
}

const QuizReview: React.FC<QuizReviewProps> = ({
  preguntas,
  attempt,
  userAnswers,
  onBack,
  onReturnToCourse,
}) => {
  const getAnswerColor = (pregunta: PreguntaFromCuestionario, optionIndex: number) => {
    const userAnswer = userAnswers[pregunta.preguntaId];
    const sortedOpciones = [...(pregunta.Opciones || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const correctAnswerIndex = sortedOpciones.findIndex(opcion => opcion.es_correcta);
    const isCorrectAnswer = optionIndex === correctAnswerIndex;
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

  const getAnswerIcon = (pregunta: PreguntaFromCuestionario, optionIndex: number) => {
    const userAnswer = userAnswers[pregunta.preguntaId];
    const sortedOpciones = [...(pregunta.Opciones || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const correctAnswerIndex = sortedOpciones.findIndex(opcion => opcion.es_correcta);
    const isCorrectAnswer = optionIndex === correctAnswerIndex;
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

  const getAnswerLabel = (pregunta: PreguntaFromCuestionario, optionIndex: number) => {
    const userAnswer = userAnswers[pregunta.preguntaId];
    const sortedOpciones = [...(pregunta.Opciones || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const correctAnswerIndex = sortedOpciones.findIndex(opcion => opcion.es_correcta);
    const isCorrectAnswer = optionIndex === correctAnswerIndex;
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
        {onReturnToCourse && (
          <Button
            startIcon={<ArrowBack />}
            onClick={onReturnToCourse}
            variant="outlined"
            color="secondary"
          >
            Volver al Curso
          </Button>
        )}
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
        {preguntas.map((pregunta, questionIndex) => {
          const sortedOpciones = [...(pregunta.Opciones || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
          const correctAnswerIndex = sortedOpciones.findIndex(opcion => opcion.es_correcta);
          const userAnswer = userAnswers[pregunta.preguntaId];
          const isCorrect = userAnswer === correctAnswerIndex;
          
          return (
            <Paper key={pregunta.preguntaId} elevation={2} sx={{ p: 4, borderRadius: 3 }}>
              {/* Question Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Pregunta {questionIndex + 1} de {preguntas.length}
                </Typography>
                <Chip
                  label={isCorrect ? 'Correcta' : 'Incorrecta'}
                  color={isCorrect ? 'success' : 'error'}
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
                {pregunta.texto_pregunta}
              </Typography>

            {/* Options */}
            <FormControl fullWidth>
              <Stack spacing={1}>
                {sortedOpciones.map((opcion, optionIndex) => {
                  const color = getAnswerColor(pregunta, optionIndex);
                  const icon = getAnswerIcon(pregunta, optionIndex);
                  const label = getAnswerLabel(pregunta, optionIndex);

                  return (
                    <Paper
                      key={opcion.opcionId}
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
                          {String.fromCharCode(65 + optionIndex)}. {opcion.texto}
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
            {pregunta.explicacion && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                  💡 Explicación: {pregunta.explicacion}
                </Typography>
              </Box>
            )}
          </Paper>
          );
        })}
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
            label={`Correctas: ${preguntas.filter(p => {
              const sortedOpciones = [...(p.Opciones || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
              const correctAnswerIndex = sortedOpciones.findIndex(opcion => opcion.es_correcta);
              return userAnswers[p.preguntaId] === correctAnswerIndex;
            }).length}/${preguntas.length}`}
            color="info"
            variant="outlined"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default QuizReview;
