'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Chip
} from '@mui/material';
import { Quiz as QuizIcon } from '@mui/icons-material';
import { PreguntaFromCuestionario } from './hooks/useQuizDetailData';

interface QuizQuestionProps {
  pregunta: PreguntaFromCuestionario;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: number;
  onAnswerSelect: (preguntaId: string, answerIndex: number) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  pregunta,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect
}) => {
  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const answerIndex = parseInt(event.target.value);
    onAnswerSelect(pregunta.preguntaId, answerIndex);
  };

  // Sort options by orden field
  const sortedOpciones = [...(pregunta.Opciones || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        {/* Header de la pregunta */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <QuizIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Pregunta {questionNumber} de {totalQuestions}
            </Typography>
            <Chip
              label={selectedAnswer !== undefined ? 'Respondida' : 'Sin responder'}
              color={selectedAnswer !== undefined ? 'success' : 'default'}
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        {/* Pregunta */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 500, 
              lineHeight: 1.4,
              color: 'text.primary'
            }}
          >
            {pregunta.texto_pregunta}
          </Typography>
        </Box>

        {/* Opciones */}
        <FormControl fullWidth>
          <RadioGroup
            value={selectedAnswer?.toString() || ''}
            onChange={handleAnswerChange}
            sx={{ gap: 1 }}
          >
            {sortedOpciones.map((opcion, index) => (
              <Paper
                key={opcion.opcionId}
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 2,
                  border: selectedAnswer === index 
                    ? '2px solid' 
                    : '1px solid',
                  borderColor: selectedAnswer === index 
                    ? 'primary.main' 
                    : 'grey.300',
                  bgcolor: selectedAnswer === index 
                    ? 'primary.50' 
                    : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50',
                    cursor: 'pointer'
                  }
                }}
              >
                <FormControlLabel
                  value={index.toString()}
                  control={
                    <Radio 
                      sx={{ 
                        ml: 1,
                        '&.Mui-checked': {
                          color: 'primary.main'
                        }
                      }} 
                    />
                  }
                  label={
                    <Box sx={{ py: 2, pr: 3 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: selectedAnswer === index ? 600 : 400,
                          color: selectedAnswer === index ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {String.fromCharCode(65 + index)}. {opcion.texto}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    m: 0,
                    width: '100%',
                    alignItems: 'flex-start'
                  }}
                />
              </Paper>
            ))}
          </RadioGroup>
        </FormControl>

        {/* Información adicional */}
        {selectedAnswer !== undefined && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
              ✓ Respuesta seleccionada: Opción {String.fromCharCode(65 + selectedAnswer)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default QuizQuestion;