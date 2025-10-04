'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayCircleIcon,
  Feedback as FeedbackIcon,
  YouTube as YouTubeIcon,
} from '@mui/icons-material';

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order: number;
  estimatedDuration?: string;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration: string;
  youtubeVideoId?: string;
  objectives?: string[];
  keyTopics?: string[];
  completed?: boolean;
}

interface CourseData {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number;
  nivel_dificultad: 'basico' | 'intermedio' | 'avanzado';
  estado: 'activo' | 'inactivo';
  instructor?: string;
  categoria?: string;
  fecha_creacion?: string;
  // Campos específicos de cursos generados desde YouTube
  source?: string;
  playlist_id?: string;
  generated_structure?: {
    title: string;
    description: string;
    modules: CourseModule[];
    tags?: string[];
    objectives?: string[];
  };
  modules?: CourseModule[];
  progress?: number;
}

// Backend Integration - Función para obtener detalles del curso
const getCourseDetails = async (courseId: string): Promise<CourseData | null> => {
  try {
    const response = await fetch(`/api/courses/${courseId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Error al obtener detalles del curso');
    }
    
    const courseData = result.data;
    
    // PROCESAR ESTRUCTURA YOUTUBE - Forzar asignación de módulos
    const finalCourseData = { ...courseData };
    
    // Si hay generated_structure con módulos, copiarlos a modules
    if (finalCourseData.generated_structure?.modules) {
      finalCourseData.modules = finalCourseData.generated_structure.modules;
    } else if (!finalCourseData.modules) {
      finalCourseData.modules = [];
    }
    
    return finalCourseData;
  } catch (error) {
    console.error('Error al cargar detalles del curso:', error);
    throw error;
  }
};

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const [expandedModule, setExpandedModule] = useState<string>('');
  const [courseProgress, setCourseProgress] = useState<number>(0);
  
  // Backend Integration - Estados para manejo de datos
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  // Backend Integration - Cargar datos del curso al montar el componente
  useEffect(() => {
    const loadCourseDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const courseData = await getCourseDetails(courseId);
        setCourse(courseData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar el curso';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadCourseDetails();
  }, [courseId]);

  // TODO: Backend Integration - Implementar hooks para progreso del usuario
  // const { userProgress, loading: progressLoading, updateLessonProgress } = useCourseProgress(courseId);
  // const { submitFeedback, loading: feedbackLoading } = useCourseFeedback();

  // Backend Integration - Manejar estados de loading y error
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => router.push('/courses')}
          sx={{ mt: 2 }}
        >
          Volver a Cursos
        </Button>
      </Box>
    );
  }
  if (!course) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Curso no encontrado
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/courses')}
          sx={{ mt: 2 }}
        >
          Volver a Cursos
        </Button>
      </Box>
    );
  }

  // Backend Integration - Calcular progreso basado en datos reales
  const calculateProgress = () => {
    if (!course.modules || course.modules.length === 0) return 0;
    
    const { totalLessons, completedLessons } = course.modules.reduce(
      (acc, module) => {
        acc.totalLessons += module.lessons?.length || 0;
        acc.completedLessons += module.lessons?.filter(lesson => lesson.completed).length || 0;
        return acc;
      },
      { totalLessons: 0, completedLessons: 0 }
    );
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const actualProgress = courseProgress || calculateProgress();

  const handleBackClick = () => {
    router.push('/courses');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours} horas`;
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? '' : moduleId);
  };

  // TODO: Backend Integration - Implementar completar lección con API
  const handleCompleteLesson = async (moduleId: string, lessonId: string) => {
    try {
      // TODO: Implementar llamada a API para marcar lección como completada
      // await updateLessonProgress(moduleId, lessonId, true);
      
      // SIMULACIÓN ACTUAL - Actualizar estado local
      if (course) {
        const updatedCourse = { ...course };
        const courseModule = updatedCourse.modules?.find(m => m.id === moduleId);
        if (courseModule) {
          const lesson = courseModule.lessons.find(l => l.id === lessonId);
          if (lesson) {
            lesson.completed = true;
            setCourse(updatedCourse);
            const newProgress = calculateProgress();
            setCourseProgress(newProgress);
            
            setNotificationMessage('¡Lección completada exitosamente!');
            setNotificationType('success');
            setShowNotification(true);
          }
        }
      }
    } catch (error) {
      console.error('Error al completar lección:', error);
      setNotificationMessage('Error al completar la lección. Intenta nuevamente.');
      setNotificationType('error');
      setShowNotification(true);
    }
  };

  // TODO: Backend Integration - Implementar envío de feedback
  const handleCourseFeedback = async () => {
    setNotificationMessage('Función de feedback en desarrollo');
    setNotificationType('success');
    setShowNotification(true);
  };

  const handleModuleFeedback = async (moduleId: string) => {
    console.log('handleModuleFeedback', moduleId);
    setNotificationMessage('Feedback de módulo en desarrollo');
    setNotificationType('success');
    setShowNotification(true);
  };

  const handleLessonFeedback = async (moduleId: string, lessonId: string) => {
    console.log('handleLessonFeedback', moduleId, lessonId);
    setNotificationMessage('Feedback de lección en desarrollo');
    setNotificationType('success');
    setShowNotification(true);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  return (
    <Box>
      {/* Header con botón de regreso */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Volver a Cursos
        </Typography>
      </Box>

      {/* Información del curso */}
      <Box sx={{ display: 'flex', gap: 4, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Card sx={{ width: { xs: '100%', md: 400 }, flexShrink: 0 }}>
          <CardMedia
            component="img"
            height="200"
            image={course.imagen_portada}
            alt={course.titulo}
            sx={{ backgroundColor: 'grey.200' }}
          />
        </Card>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', flex: 1 }}>
              {course.titulo}
            </Typography>
            {course.source === 'youtube' && (
              <Chip 
                icon={<YouTubeIcon />} 
                label="YouTube" 
                color="error" 
                variant="outlined" 
                size="small"
              />
            )}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {course.descripcion}
          </Typography>

          {course.instructor && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Instructor:</strong> {course.instructor}
            </Typography>
          )}

          {course.categoria && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>Categoría:</strong> {course.categoria}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Duración:</strong> {formatDuration(course.duracion_estimada)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Nivel:</strong> {course.nivel_dificultad}
          </Typography>

          {/* Mostrar objetivos del curso si existen */}
          {course.generated_structure?.objectives && course.generated_structure.objectives.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Objetivos del curso:
              </Typography>
              <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
                {course.generated_structure.objectives.map((objective, index) => (
                  <Typography component="li" variant="body2" color="text.secondary" key={index}>
                    {objective}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Progreso del curso */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {actualProgress}% completado
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FeedbackIcon />}
                onClick={handleCourseFeedback}
                sx={{ textTransform: 'none' }}
              >
                Feedback del curso
              </Button>
            </Box>
            <LinearProgress
              variant="determinate"
              value={actualProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: 'primary.main',
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Contenido del curso */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Contenido del Curso
      </Typography>

      {/* Verificar si hay módulos */}
      {!course.modules || course.modules.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Sin contenido estructurado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Este curso aún no tiene módulos y lecciones definidos.
            </Typography>
            {course.source === 'youtube' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Los cursos generados desde YouTube incluyen automáticamente la estructura de módulos.
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        course.modules.map((module) => (
          <Card key={module.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  mb: expandedModule === module.id ? 2 : 0
                }}
                onClick={() => toggleModule(module.id)}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {module.title}
                  </Typography>
                  {module.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {module.description}
                    </Typography>
                  )}
                  {module.estimatedDuration && (
                    <Typography variant="caption" color="text.secondary">
                      Duración estimada: {module.estimatedDuration}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  aria-label={expandedModule === module.id ? 'Colapsar módulo' : 'Expandir módulo'}
                >
                  <PlayCircleIcon 
                    sx={{ 
                      transform: expandedModule === module.id ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </IconButton>
              </Box>

              {expandedModule === module.id && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Verificar si hay lecciones en el módulo */}
                  {!module.lessons || module.lessons.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Este módulo no tiene lecciones definidas.
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {module.lessons.map((lesson, lessonIndex) => (
                        <ListItem 
                          key={lesson.id}
                          sx={{ 
                            pl: 0,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' },
                            borderRadius: 1,
                            mb: 1,
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                          }}
                          onClick={() => {
                            // Si tiene video de YouTube, abrir en nueva pestaña
                            if (lesson.youtubeVideoId) {
                              window.open(`https://www.youtube.com/watch?v=${lesson.youtubeVideoId}`, '_blank');
                            } else {
                              router.push(`/courses/${courseId}/lesson/${lesson.id}`);
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <ListItemIcon>
                              {lesson.youtubeVideoId ? (
                                <YouTubeIcon color={lesson.completed ? 'success' : 'primary'} />
                              ) : (
                                <CheckCircleIcon 
                                  color={lesson.completed ? 'success' : 'disabled'} 
                                />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={`Lección ${lessonIndex + 1}: ${lesson.title}`}
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {lesson.duration}
                                  </Typography>
                                  {lesson.youtubeVideoId && (
                                    <Chip 
                                      label="Ver en YouTube" 
                                      size="small" 
                                      color="error" 
                                      variant="outlined"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{
                                '& .MuiListItemText-primary': {
                                  textDecoration: lesson.completed ? 'line-through' : 'none',
                                  color: lesson.completed ? 'text.secondary' : 'text.primary'
                                }
                              }}
                            />
                            {!lesson.completed && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteLesson(module.id, lesson.id);
                                }}
                                sx={{ textTransform: 'none' }}
                              >
                                Completar
                              </Button>
                            )}
                            {lesson.completed && (
                              <Chip
                                label="Feedback"
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLessonFeedback(module.id, lesson.id);
                                }}
                              />
                            )}
                          </Box>
                          
                          {/* Mostrar información adicional de la lección */}
                          {(lesson.description || lesson.objectives || lesson.keyTopics) && (
                            <Box sx={{ mt: 1, pl: 6, width: '100%' }}>
                              {lesson.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {lesson.description}
                                </Typography>
                              )}
                              {lesson.objectives && lesson.objectives.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    Objetivos:
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    {lesson.objectives.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                              {lesson.keyTopics && lesson.keyTopics.length > 0 && (
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    Temas clave:
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    {lesson.keyTopics.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FeedbackIcon />}
                      onClick={() => handleModuleFeedback(module.id)}
                      sx={{ textTransform: 'none' }}
                    >
                      Feedback del módulo
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Mostrar tags si existen */}
      {course.generated_structure?.tags && course.generated_structure.tags.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Tags del curso
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {course.generated_structure.tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                variant="outlined" 
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Notificaciones */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notificationType}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}