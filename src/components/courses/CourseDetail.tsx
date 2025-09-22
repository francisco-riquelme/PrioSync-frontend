'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayCircleIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';

interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

interface CourseData {
  id_curso: number;
  titulo: string;
  descripcion: string;
  imagen_portada: string;
  duracion_estimada: number;
  nivel_dificultad: 'basico' | 'intermedio' | 'avanzado';
  estado: 'activo' | 'inactivo';
  modules: CourseModule[];
  progress?: number;
}

// Datos de ejemplo - coinciden con el esquema de la base de datos
// TODO: Backend Integration - Reemplazar con llamada a API para obtener cursos detallados
// GET /api/courses/[id] - Obtener datos completos del curso incluyendo módulos y lecciones
const courseData: Record<string, CourseData> = {
  '1': {
    id_curso: 1,
    titulo: 'Cálculo Avanzado',
    descripcion: 'Curso completo de cálculo diferencial e integral',
    imagen_portada: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 1800, // 30 horas
    nivel_dificultad: 'intermedio',
    estado: 'activo',
    modules: [
      {
        id: 'derivadas',
        title: 'Módulo 1: Derivadas',
        lessons: [
          { id: 'intro-derivadas', title: 'Introducción a Derivadas', duration: '25 min', completed: true },
          { id: 'regla-cadena', title: 'Regla de la Cadena', duration: '35 min', completed: false },
          { id: 'aplicaciones', title: 'Aplicaciones', duration: '40 min', completed: false },
        ]
      },
      {
        id: 'integrales',
        title: 'Módulo 2: Integrales',
        lessons: [
          { id: 'integrales-definidas', title: 'Integrales Definidas', duration: '30 min', completed: false },
          { id: 'tecnicas-integracion', title: 'Técnicas de Integración', duration: '50 min', completed: false },
        ]
      }
    ]
  },
  '2': {
    id_curso: 2,
    titulo: 'Desarrollo de Software',
    descripcion: 'Fundamentos de programación y desarrollo de aplicaciones',
    imagen_portada: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 2400, // 40 horas
    nivel_dificultad: 'basico',
    estado: 'activo',
    modules: [
      {
        id: 'fundamentos',
        title: 'Módulo 1: Fundamentos',
        lessons: [
          { id: 'intro-programacion', title: 'Introducción a la Programación', duration: '30 min', completed: false },
          { id: 'estructuras-datos', title: 'Estructuras de Datos', duration: '45 min', completed: false },
        ]
      }
    ]
  },
  '3': {
    id_curso: 3,
    titulo: 'Inteligencia Artificial',
    descripcion: 'Introducción a machine learning y redes neuronales',
    imagen_portada: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop&auto=format',
    duracion_estimada: 3600, // 60 horas
    nivel_dificultad: 'avanzado',
    estado: 'activo',
    modules: [
      {
        id: 'intro-ia',
        title: 'Módulo 1: Introducción a IA',
        lessons: [
          { id: 'conceptos-basicos', title: 'Conceptos Básicos', duration: '20 min', completed: false },
          { id: 'machine-learning', title: 'Machine Learning', duration: '40 min', completed: false },
        ]
      }
    ]
  },
};

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const [expandedModule, setExpandedModule] = useState<string>('');
  const [courseProgress, setCourseProgress] = useState<number>(0);

  // TODO: Backend Integration - Implementar hooks para obtener datos del curso
  // const { course, loading: courseLoading, error: courseError } = useCourseDetail(courseId);
  // const { userProgress, loading: progressLoading, updateLessonProgress } = useCourseProgress(courseId);
  // const { submitFeedback, loading: feedbackLoading } = useCourseFeedback();

  const course = courseData[courseId];

  // TODO: Backend Integration - Manejar estados de loading y error
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

  // TODO: Backend Integration - Obtener progreso real del usuario desde el backend
  // El progreso debería venir de userProgress en lugar de calcularse localmente
  const calculateProgress = () => {
    const { totalLessons, completedLessons } = course.modules.reduce(
      (acc, module) => {
        acc.totalLessons += module.lessons.length;
        acc.completedLessons += module.lessons.filter(lesson => lesson.completed).length;
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
    // try {
    //   await updateLessonProgress(moduleId, lessonId, true);
    //   // Actualizar estado local optimísticamente o refrescar datos
    //   // Mostrar notificación de éxito
    // } catch (error) {
    //   console.error('Error al completar lección:', error);
    //   // Mostrar mensaje de error
    // }

    // SIMULACIÓN ACTUAL - Reemplazar con llamada a API
    const updatedData = { ...courseData };
    const courseModule = updatedData[courseId].modules.find(m => m.id === moduleId);
    if (courseModule) {
      const lesson = courseModule.lessons.find(l => l.id === lessonId);
      if (lesson) {
        lesson.completed = true;
        const newProgress = calculateProgress();
        setCourseProgress(newProgress);
      }
    }
  };

  // TODO: Backend Integration - Implementar envío de feedback
  const handleCourseFeedback = async () => {
    // try {
    //   // Abrir modal de feedback o navegar a página de feedback
    //   // await submitFeedback(courseId, feedbackData);
    // } catch (error) {
    //   console.error('Error al enviar feedback:', error);
    // }
  };

  const handleModuleFeedback = async (moduleId: string) => {
    // try {
    //   // await submitFeedback(courseId, feedbackData, { moduleId });
    // } catch (error) {
    //   console.error('Error al enviar feedback del módulo:', error);
    // }
  };

  const handleLessonFeedback = async (moduleId: string, lessonId: string) => {
    // try {
    //   // await submitFeedback(courseId, feedbackData, { moduleId, lessonId });
    // } catch (error) {
    //   console.error('Error al enviar feedback de la lección:', error);
    // }
  };

  return (
    <Box>
      {/* TODO: Backend Integration - Agregar estados de loading */}
      {/* {(courseLoading || progressLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )} */}

      {/* {courseError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar el curso. Por favor, intenta nuevamente.
        </Alert>
      )} */}

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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            {course.titulo}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {course.descripcion}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Duración:</strong> {formatDuration(course.duracion_estimada)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Nivel:</strong> {course.nivel_dificultad}
          </Typography>

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

      {course.modules.map((module, moduleIndex) => (
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
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {module.title}
              </Typography>
              <IconButton
                aria-label={expandedModule === module.id ? 'Collapse module' : 'Expand module'}
              >
                <PlayCircleIcon />
              </IconButton>
            </Box>

            {expandedModule === module.id && (
              <>
                <Divider sx={{ mb: 2 }} />
                <List disablePadding>
                  {module.lessons.map((lesson) => (
                    <ListItem 
                      key={lesson.id}
                      sx={{ 
                        pl: 0,
                        '&:hover': { backgroundColor: 'action.hover' },
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        <CheckCircleIcon 
                          color={lesson.completed ? 'success' : 'disabled'} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={lesson.title}
                        secondary={lesson.duration}
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
                    </ListItem>
                  ))}
                </List>

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
      ))}

      {/* TODO: Backend Integration - Loading overlay para acciones */}
      {/* {feedbackLoading && (
        <Backdrop open={feedbackLoading} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )} */}

      {/* TODO: Backend Integration - Snackbar para notificaciones */}
      {/* <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notificationType}>
          {notificationMessage}
        </Alert>
      </Snackbar> */}
    </Box>
  );
}