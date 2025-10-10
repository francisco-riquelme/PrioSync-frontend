'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip
} from '@mui/material';
import {
  PlayArrow,
  Quiz as QuizIcon,
  Schedule,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material';
import { CuestionarioWithQuestions, PreguntaFromCuestionario } from './hooks/useQuizDetailData';

interface QuizInstructionsProps {
  quiz: CuestionarioWithQuestions;
  preguntas: PreguntaFromCuestionario[];
  onStartQuiz: () => void;
  onReturnToCourse: () => void;
}

const QuizInstructions: React.FC<QuizInstructionsProps> = ({
  quiz,
  preguntas,
  onStartQuiz,
  onReturnToCourse
}) => {
  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 2 }}>
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          {/* Header - More compact */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <QuizIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              {quiz.titulo}
            </Typography>
            <Chip
              label="Curso"
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
          </Box>

          {/* Description - More compact */}
          {quiz.descripcion && (
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
              {quiz.descripcion}
            </Typography>
          )}

          {/* Stats Row - More compact and integrated */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 2, 
            gap: 1
          }}>
            <Box sx={{ 
              flex: 1, 
              textAlign: 'center', 
              p: 1.5, 
              bgcolor: 'primary.50', 
              borderRadius: 1 
            }}>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {preguntas.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Preguntas
              </Typography>
            </Box>
            <Box sx={{ 
              flex: 1, 
              textAlign: 'center', 
              p: 1.5, 
              bgcolor: 'info.50', 
              borderRadius: 1 
            }}>
              <Typography variant="h6" color="info.main" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 0.5, 
                fontWeight: 'bold' 
              }}>
                <Schedule sx={{ fontSize: 16 }} />
                {quiz.duracion_minutos || 30}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Minutos
              </Typography>
            </Box>
            <Box sx={{ 
              flex: 1, 
              textAlign: 'center', 
              p: 1.5, 
              bgcolor: 'success.50', 
              borderRadius: 1 
            }}>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                {quiz.porcentaje_aprobacion || 70}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Para Aprobar
              </Typography>
            </Box>
          </Box>

          {/* Instructions - More compact */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              fontWeight: 'bold' 
            }}>
              <CheckCircle sx={{ color: 'primary.main', fontSize: 20 }} />
              Instrucciones:
            </Typography>
            <Stack spacing={0.8} sx={{ ml: 1 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography component="span" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '16px' }}>
                  •
                </Typography>
                <Typography component="span">
                  <strong>{preguntas.length} preguntas</strong> de selección múltiple
                </Typography>
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography component="span" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '16px' }}>
                  •
                </Typography>
                <Typography component="span">
                  <strong>{quiz.duracion_minutos || 30} minutos</strong> para completar
                </Typography>
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography component="span" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '16px' }}>
                  •
                </Typography>
                <Typography component="span">
                  Mínimo <strong>{quiz.porcentaje_aprobacion || 70}%</strong> para aprobar
                </Typography>
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography component="span" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '16px' }}>
                  •
                </Typography>
                <Typography component="span">
                  Navegación libre entre preguntas
                </Typography>
              </Typography>
              
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography component="span" sx={{ color: 'primary.main', fontWeight: 'bold', minWidth: '16px' }}>
                  •
                </Typography>
                <Typography component="span">
                  Temporizador automático al iniciar
                </Typography>
              </Typography>
            </Stack>
          </Box>

          {/* Start Button - More compact */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={onStartQuiz}
              startIcon={<PlayArrow />}
              sx={{ px: 3, py: 1, fontSize: '1rem', fontWeight: 'bold' }}
            >
              Iniciar Quiz
            </Button>
            
            {/* Return to Course Button */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="medium"
                onClick={onReturnToCourse}
                startIcon={<ArrowBack />}
                sx={{ px: 2, py: 0.5, fontSize: '0.9rem' }}
              >
                Volver al Curso
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuizInstructions;