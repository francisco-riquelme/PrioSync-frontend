'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Lightbulb,
  TrendingUp,
  School,
  ArrowBack
} from '@mui/icons-material';

interface QuizResultsProps {
  score: number; // Puntos obtenidos
  totalQuestions: number; // Total de preguntas
  totalPoints?: number; // Puntos máximos (opcional para compatibilidad)
  correctCount?: number; // Respuestas correctas (opcional para compatibilidad)
  percentage: number;
  passed: boolean;
  passingScore: number;
  onRetry: () => void;
  onViewRecommendations?: () => void;
  onReturnToCourse?: () => void;
  showRecommendationsButton?: boolean;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  totalPoints,
  correctCount,
  percentage,
  passed,
  passingScore,
  onRetry,
  onViewRecommendations,
  onReturnToCourse,
  showRecommendationsButton = true
}) => {
  // Usar los valores correctos: score es puntos, correctCount es respuestas
  const displayScore = totalPoints !== undefined ? score : correctCount || score;
  const displayTotal = totalPoints !== undefined ? totalPoints : totalQuestions;
  const displayCorrect = correctCount !== undefined ? correctCount : score;
  const displayIncorrect = totalQuestions - displayCorrect;
  const getResultIcon = () => {
    if (passed) {
      return <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />;
    }
    return <Cancel sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />;
  };

  const getResultTitle = () => {
    if (percentage >= 90) return '¡Excelente trabajo!';
    if (percentage >= 80) return '¡Muy bien hecho!';
    if (passed) return '¡Felicitaciones!';
    return 'No alcanzaste la puntuación mínima';
  };

  const getResultMessage = () => {
    if (percentage >= 90) {
      return 'Has demostrado un dominio excepcional del tema. ¡Sigue así!';
    }
    if (percentage >= 80) {
      return 'Tienes un buen entendimiento del tema. Hay algunas áreas que podrías reforzar.';
    }
    if (passed) {
      return 'Has aprobado el quiz. Te recomendamos revisar algunos conceptos para mejorar.';
    }
    return 'Necesitas estudiar más para dominar estos conceptos. ¡No te desanimes!';
  };

  const getPerformanceLevel = () => {
    if (percentage >= 90) return { label: 'EXCELENTE', color: 'success' as const };
    if (percentage >= 80) return { label: 'MUY BUENO', color: 'info' as const };
    if (passed) return { label: 'APROBADO', color: 'success' as const };
    return { label: 'NO APROBADO', color: 'error' as const };
  };

  const performanceLevel = getPerformanceLevel();

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Card elevation={3} sx={{ textAlign: 'center', mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Ícono de resultado */}
          {getResultIcon()}
          
          {/* Título */}
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            {getResultTitle()}
          </Typography>
          
          {/* Puntuación principal */}
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={120}
              thickness={4}
              sx={{ color: 'grey.200' }}
            />
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={120}
              thickness={4}
              sx={{
                color: passed ? 'success.main' : 'error.main',
                position: 'absolute',
                left: 0,
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: passed ? 'success.main' : 'error.main' }}>
                {percentage}%
              </Typography>
            </Box>
          </Box>

          {/* Detalles de puntuación */}
          <Typography variant="h6" sx={{ mb: 1 }}>
            {displayScore} de {displayTotal} puntos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {displayCorrect} de {totalQuestions} respuestas correctas
          </Typography>
          
          {/* Chip de estado */}
          <Chip 
            label={performanceLevel.label}
            color={performanceLevel.color}
            variant="filled"
            sx={{ 
              fontWeight: 'bold', 
              fontSize: '0.9rem',
              mb: 3,
              px: 2,
              py: 0.5
            }}
          />

          {/* Mensaje de resultado */}
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mb: 3, lineHeight: 1.6 }}
          >
            {getResultMessage()}
          </Typography>

          {/* Estadísticas adicionales */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: 2, 
            mb: 3,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 2
          }}>
            <Box>
              <Typography variant="h6" color="success.main">
                {displayScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Puntos Obtenidos
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" color="primary.main">
                {displayCorrect}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Correctas
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" color="error.main">
                {displayIncorrect}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Incorrectas
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" color="info.main">
                {passingScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Para Aprobar
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button 
          variant="outlined" 
          onClick={onRetry}
          startIcon={<Refresh />}
          size="large"
        >
          Reintentar Quiz
        </Button>
        
        {showRecommendationsButton && onViewRecommendations && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={percentage >= 75 ? <TrendingUp /> : <Lightbulb />}
            onClick={onViewRecommendations}
            size="large"
          >
            {percentage >= 75 ? 'Siguiente Nivel' : 'Ver Recomendaciones'}
          </Button>
        )}
        
        {!showRecommendationsButton && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<School />}
            href="/courses"
            size="large"
          >
            Explorar Cursos
          </Button>
        )}
        
        {onReturnToCourse && (
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={onReturnToCourse}
            startIcon={<ArrowBack />}
            size="large"
          >
            Volver al Curso
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default QuizResults;