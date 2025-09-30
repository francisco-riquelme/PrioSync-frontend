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
  CheckCircle
} from '@mui/icons-material';
import { QuizData } from '@/types/quiz';

interface QuizInstructionsProps {
  quizData: QuizData;
  onStartQuiz: () => void;
}

const QuizInstructions: React.FC<QuizInstructionsProps> = ({
  quizData,
  onStartQuiz
}) => {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <QuizIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              {quizData.title}
            </Typography>
            <Chip
              label={quizData.courseName}
              color="primary"
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Box>

          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            {quizData.description}
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: 'primary.main' }} />
              Instrucciones:
            </Typography>
            <Stack spacing={1.5} sx={{ ml: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: '24px', fontWeight: 'bold', color: 'primary.main' }}>
                  •
                </Typography>
                <Typography variant="body2">
                  Este quiz tiene <strong>{quizData.questions.length} preguntas</strong> de selección múltiple
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: '24px', fontWeight: 'bold', color: 'primary.main' }}>
                  •
                </Typography>
                <Typography variant="body2">
                  Tienes <strong>{quizData.timeLimit} minutos</strong> para completar todas las preguntas
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: '24px', fontWeight: 'bold', color: 'primary.main' }}>
                  •
                </Typography>
                <Typography variant="body2">
                  Necesitas obtener al menos <strong>{quizData.passingScore}%</strong> para aprobar
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: '24px', fontWeight: 'bold', color: 'primary.main' }}>
                  •
                </Typography>
                <Typography variant="body2">
                  Puedes navegar entre las preguntas usando los botones de navegación
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: '24px', fontWeight: 'bold', color: 'primary.main' }}>
                  •
                </Typography>
                <Typography variant="body2">
                  Una vez que inicies el quiz, el temporizador comenzará automáticamente
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Resumen estadístico */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            mb: 4, 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 2 
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main">
                {quizData.questions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Preguntas
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule sx={{ fontSize: 18 }} />
                {quizData.timeLimit}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Minutos
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main">
                {quizData.passingScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Para Aprobar
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={onStartQuiz}
              startIcon={<PlayArrow />}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              Iniciar Quiz
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuizInstructions;