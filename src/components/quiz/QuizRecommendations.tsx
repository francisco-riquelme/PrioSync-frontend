'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Schedule,
  Lightbulb,
  Star,
  BookmarkBorder,
  ArrowForward,
  School,
  CheckCircle
} from '@mui/icons-material';
import { StudyRecommendation, QuizAnalysis } from '@/types/quiz';

interface QuizRecommendationsProps {
  analysis: QuizAnalysis;
  onBackToResults: () => void;
  onActionClick: (recommendation: StudyRecommendation) => void;
}

const QuizRecommendations: React.FC<QuizRecommendationsProps> = ({
  analysis,
  onBackToResults,
  onActionClick
}) => {
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      TrendingUp: <TrendingUp />,
      Assignment: <Assignment />,
      Schedule: <Schedule />,
      Lightbulb: <Lightbulb />,
      Star: <Star />,
      BookmarkBorder: <BookmarkBorder />,
      School: <School />,
      CheckCircle: <CheckCircle />
    };
    return iconMap[iconName] || <Lightbulb />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const getLevelMessage = () => {
    switch (analysis.level) {
      case 'excellent':
        return {
          title: '¡Excelente dominio!',
          message: 'Has demostrado un dominio excepcional de React. Estás listo para desafíos más avanzados.',
          color: 'success.main'
        };
      case 'good':
        return {
          title: 'Buen rendimiento',
          message: 'Tienes una base sólida en React. Con un poco más de práctica puedes alcanzar la excelencia.',
          color: 'info.main'
        };
      case 'needs-improvement':
        return {
          title: 'Necesitas mejorar',
          message: 'Hay conceptos importantes que necesitas reforzar. Te recomendamos revisar los temas específicos.',
          color: 'warning.main'
        };
      case 'critical':
        return {
          title: 'Requiere atención urgente',
          message: 'Es importante que dediques tiempo a estudiar los fundamentos antes de continuar.',
          color: 'error.main'
        };
      default:
        return {
          title: 'Evaluación completada',
          message: 'Hemos analizado tu rendimiento y preparado recomendaciones personalizadas.',
          color: 'primary.main'
        };
    }
  };

  const levelInfo = getLevelMessage();

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      {/* Header con análisis general */}
      <Card elevation={3} sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Recomendaciones Personalizadas
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
              {levelInfo.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
              {levelInfo.message}
            </Typography>
            
            {/* Estadísticas rápidas */}
            <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 3 }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {analysis.percentage}%
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Tu puntuación
                </Typography>
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {analysis.recommendations.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Recomendaciones
                </Typography>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Fortalezas y Debilidades */}
      {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Fortalezas */}
          {analysis.strengths.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      Fortalezas
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {analysis.strengths.map((strength, index) => (
                      <Chip
                        key={index}
                        label={strength}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Debilidades */}
          {analysis.weaknesses.length > 0 && (
            <Box sx={{ flex: 1 }}>
              <Card sx={{ height: '100%', border: '2px solid', borderColor: 'warning.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Lightbulb sx={{ color: 'warning.main' }} />
                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      Áreas a Mejorar
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {analysis.weaknesses.map((weakness, index) => (
                      <Chip
                        key={index}
                        label={weakness}
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}

      {/* Recomendaciones */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Recomendaciones de Estudio
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
        {analysis.recommendations.map((recommendation) => (
          <Box key={recommendation.id}>
            <Card 
              sx={{ 
                height: '100%', 
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header de la recomendación */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${getPriorityColor(recommendation.priority)}.main`,
                      width: 48,
                      height: 48
                    }}
                  >
                    {getIconComponent(recommendation.icon)}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {recommendation.title}
                      </Typography>
                      <Chip
                        label={recommendation.priority.toUpperCase()}
                        color={getPriorityColor(recommendation.priority) as 'error' | 'warning' | 'info'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Chip
                      label={recommendation.type.toUpperCase()}
                      size="small"
                      variant="filled"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Box>

                {/* Descripción */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 3, lineHeight: 1.6 }}
                >
                  {recommendation.description}
                </Typography>

                {/* Botón de acción */}
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={() => onActionClick(recommendation)}
                  fullWidth
                  sx={{
                    bgcolor: `${getPriorityColor(recommendation.priority)}.main`,
                    '&:hover': {
                      bgcolor: `${getPriorityColor(recommendation.priority)}.dark`,
                    }
                  }}
                >
                  {recommendation.action.label}
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 4 }} />

      {/* Botones de navegación */}
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button 
          variant="outlined" 
          onClick={onBackToResults}
          size="large"
        >
          Ver Resultados
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<School />}
          href="/courses"
          size="large"
        >
          Explorar Cursos
        </Button>
      </Stack>
    </Box>
  );
};

export default QuizRecommendations;