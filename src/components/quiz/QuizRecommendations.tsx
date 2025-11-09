'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  CircularProgress,
  Alert
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
  CheckCircle,
  Close,
  ArrowBack
} from '@mui/icons-material';
import { StudyRecommendation, QuizAnalysis } from '@/types/quiz';
import { useGenerarRetroalimentacion } from './hooks/useGenerarRetroalimentacion';

interface QuizRecommendationsProps {
  analysis: QuizAnalysis;
  onBackToResults: () => void;
  onActionClick: (recommendation: StudyRecommendation) => void;
  onReturnToCourse?: () => void;
  progresoCuestionarioId?: string;
  cuestionarioId?: string;
  usuarioId?: string;
}

const QuizRecommendations: React.FC<QuizRecommendationsProps> = ({
  analysis,
  onBackToResults,
  onActionClick,
  onReturnToCourse,
  progresoCuestionarioId,
  cuestionarioId,
  usuarioId,
}) => {
  const [llmFeedback, setLlmFeedback] = useState<string | null>(analysis.llmFeedback || null);
  const [recommendedLessons, setRecommendedLessons] = useState<typeof analysis.recommendedLessons>(analysis.recommendedLessons || []);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(analysis.llmError || null);

  const { generar } = useGenerarRetroalimentacion({
    onSuccess: (feedback, lessons) => {
      console.log('[QuizRecommendations] Retroalimentación recibida:', feedback);
      console.log('[QuizRecommendations] Lecciones recomendadas:', lessons);
      setLlmFeedback(feedback);
      if (lessons) {
        setRecommendedLessons(lessons);
      }
      setFeedbackLoading(false);
    },
    onError: (error) => {
      console.error('[QuizRecommendations] Error recibido:', error);
      setFeedbackError(error);
      setFeedbackLoading(false);
    },
  });

  // Generar retroalimentación si no está disponible y tenemos los IDs necesarios
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const generarRetroalimentacion = async () => {
      if (llmFeedback || feedbackLoading || feedbackError) {
        return;
      }

      if (!progresoCuestionarioId || !cuestionarioId || !usuarioId) {
        console.warn('[QuizRecommendations] Faltan IDs necesarios:', {
          progresoCuestionarioId,
          cuestionarioId,
          usuarioId,
        });
        return;
      }

      console.log('[QuizRecommendations] Iniciando generación de retroalimentación...');
      setFeedbackLoading(true);

      // Timeout de seguridad de 30 segundos
      timeoutId = setTimeout(() => {
        if (isMounted && feedbackLoading) {
          console.error('[QuizRecommendations] Timeout: La generación tardó más de 30 segundos');
          setFeedbackError('La generación de retroalimentación está tardando más de lo esperado');
          setFeedbackLoading(false);
        }
      }, 30000);

      try {
        await generar(progresoCuestionarioId, cuestionarioId, usuarioId);
      } catch (err) {
        console.error('[QuizRecommendations] Error al generar:', err);
        if (isMounted) {
          setFeedbackError('Error al generar retroalimentación');
          setFeedbackLoading(false);
        }
      }
    };

    generarRetroalimentacion();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progresoCuestionarioId, cuestionarioId, usuarioId]); // Solo queremos ejecutar cuando cambien los IDs

  // Sincronizar estado con props si cambia
  useEffect(() => {
    if (analysis.llmFeedback && analysis.llmFeedback !== llmFeedback) {
      setLlmFeedback(analysis.llmFeedback);
      setFeedbackLoading(false);
    }
  }, [analysis.llmFeedback, llmFeedback]);

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
      {/* Botones de navegación superior */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant="outlined" 
          onClick={onBackToResults}
          startIcon={<ArrowBack />}
          size="medium"
        >
          Volver
        </Button>
        
        {onReturnToCourse && (
          <Button 
            variant="outlined" 
            onClick={onReturnToCourse}
            size="medium"
          >
            Volver al Curso
          </Button>
        )}
      </Stack>

      {/* Header con análisis general */}
      <Card elevation={3} sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Recomendaciones Personalizadas
            </Typography>

            {/* Mostrar retroalimentación del LLM, loading o fallback */}
            {feedbackLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 3 }}>
                <CircularProgress size={40} sx={{ color: 'white' }} />
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  Generando retroalimentación personalizada...
                </Typography>
              </Box>
            ) : feedbackError ? (
              <Box sx={{ my: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                  {levelInfo.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
                  {levelInfo.message}
                </Typography>
                <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
                  No se pudo generar retroalimentación personalizada
                </Alert>
              </Box>
            ) : llmFeedback ? (
              <Box sx={{ my: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                  {levelInfo.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, maxWidth: 700, mx: 'auto', lineHeight: 1.8 }}>
                  {llmFeedback}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ my: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
                  {levelInfo.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.8, maxWidth: 600, mx: 'auto' }}>
                  {levelInfo.message}
                </Typography>
              </Box>
            )}
            
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

      {/* Preguntas correctas e incorrectas */}
      {((analysis.strengthDetails && analysis.strengthDetails.length > 0) || 
        (analysis.weaknessDetails && analysis.weaknessDetails.length > 0)) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4, mb: 4 }}>
          {/* Preguntas respondidas correctamente */}
          {analysis.strengthDetails && analysis.strengthDetails.length > 0 && (
            <Card 
              elevation={3}
              sx={{ 
                border: '2px solid', 
                borderColor: 'success.main',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Preguntas respondidas correctamente
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {analysis.strengthDetails.map((detail, index) => (
                    <Box key={index}>
                      <Box
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'success.light',
                          borderRadius: 2,
                          p: 2,
                          backgroundColor: 'success.lighter',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'success.light',
                            boxShadow: 1
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                          {index + 1}. {detail.question}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ color: 'success.dark', fontStyle: 'italic' }}>
                            Tu respuesta: {detail.userAnswer}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Preguntas con respuestas incorrectas */}
          {analysis.weaknessDetails && analysis.weaknessDetails.length > 0 && (
            <Card 
              elevation={3}
              sx={{ 
                border: '2px solid', 
                borderColor: 'error.main',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Close sx={{ color: 'error.main', fontSize: 28 }} />
                  <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Preguntas con respuestas incorrectas
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {analysis.weaknessDetails.map((detail, index) => (
                    <Box key={index}>
                      <Box
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'error.light',
                          borderRadius: 2,
                          p: 2,
                          backgroundColor: 'error.lighter',
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: 'error.light',
                            boxShadow: 1
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                          {index + 1}. {detail.question}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2, mb: 1 }}>
                          <Close sx={{ color: 'error.main', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ color: 'error.dark', fontStyle: 'italic' }}>
                            Tu respuesta: {detail.userAnswer}
                          </Typography>
                        </Box>
                        {detail.correctAnswer && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
                            <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 500 }}>
                              Respuesta correcta: {detail.correctAnswer}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Lecciones Recomendadas por el LLM */}
      {recommendedLessons && recommendedLessons.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Lecciones Recomendadas para Repasar
          </Typography>
          
          <Stack spacing={2}>
            {recommendedLessons.map((lesson, index) => (
              <Card 
                key={lesson.leccionId}
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 40,
                        height: 40,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {lesson.titulo}
                      </Typography>
                      
                      {lesson.moduloTitulo && (
                        <Chip
                          label={lesson.moduloTitulo}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1.5 }}
                        />
                      )}
                      
                      {lesson.descripcion && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {lesson.descripcion}
                        </Typography>
                      )}
                      
                      <Box 
                        sx={{ 
                          backgroundColor: 'info.lighter', 
                          borderLeft: '4px solid',
                          borderColor: 'info.main',
                          p: 1.5,
                          borderRadius: 1,
                          mb: 2
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'info.dark' }}>
                          💡 {lesson.razon}
                        </Typography>
                      </Box>
                      
                      {lesson.url_contenido && (
                        <Button
                          variant="contained"
                          size="small"
                          endIcon={<ArrowForward />}
                          onClick={() => window.open(lesson.url_contenido, '_blank')}
                          sx={{ mt: 1 }}
                        >
                          Ver Lección
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
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
    </Box>
  );
};

export default QuizRecommendations;