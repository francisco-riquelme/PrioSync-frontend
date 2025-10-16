'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  IconButton,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { useCourseDetailData } from '@/components/courses/hooks/useCourseDetailData';
import { useProgresoCurso } from '@/components/courses/hooks/useProgresoCurso';
import { useUser } from '@/contexts/UserContext';
import StudySessionsTable from './StudySessionsTable';
import CourseContent from './CourseContent';

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const { userData } = useUser();

  // Fetch all course data with the new unified hook
  const { course, modulos, materiales, quizzes, loading, error } = useCourseDetailData({ cursoId: courseId });

  // Calcular progreso del curso
  const {
    progreso,
    leccionesCompletadas,
    totalLecciones,
  } = useProgresoCurso({
    modulos,
    usuarioId: userData?.usuarioId || '',
  });





  // Handle loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle error state
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

  // Handle course not found
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

  // Usar el progreso real calculado desde el hook
  const actualProgress = progreso;

  const handleBackClick = () => {
    router.push('/courses');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours} horas`;
  };

  // // TODO: Backend Integration - Implementar completar lección con API
  // const handleCompleteLesson = async (moduleId: string, lessonId: string) => {
  //   // TODO: Implement with real API call
  //   console.log('Complete lesson:', moduleId, lessonId);
  // };

  // TODO: Backend Integration - Implementar envío de feedback
  const handleCourseFeedback = async () => {
    // TODO: Implement with real API call
    console.log('Course feedback');
  };

  // const handleModuleFeedback = async (moduleId: string) => {
  //   console.log('Module feedback:', moduleId);
  // };

  // const handleLessonFeedback = async (moduleId: string, lessonId: string) => {
  //   console.log('Lesson feedback:', moduleId, lessonId);
  // };

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
            image={course.imagen_portada || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format'}
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
            <strong>Duración:</strong> {formatDuration(course.duracion_estimada || 0)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Nivel:</strong> {course.nivel_dificultad}
          </Typography>

          {/* Progreso del curso */}
          <Box sx={{ mb: 2 }} key={`progress-${actualProgress}-${leccionesCompletadas}-${totalLecciones}`}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {actualProgress}% completado
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {leccionesCompletadas} de {totalLecciones} lecciones completadas
                </Typography>
              </Box>
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
                  backgroundColor: actualProgress === 100 ? 'success.main' : 'primary.main',
                },
              }}
            />
          </Box>
        </Box>
      </Box>
      
      {/* Contenido del curso */}
      <CourseContent 
        modulos={modulos}
        materiales={materiales}
        materialesLoading={false}
        cuestionarios={quizzes}
        quizzesLoading={false}
      />

      {/* Sesiones de Estudio */}
      <StudySessionsTable sessions={[]} loading={false} />

    </Box>
  );
}