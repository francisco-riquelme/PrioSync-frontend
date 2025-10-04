'use client';

import React, { useState, useEffect } from 'react';
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
  YouTube as YouTubeIcon,
} from '@mui/icons-material';
import { useCourse } from '@/components/courses/hooks/useCourse';
import StudySessionsTable from './StudySessionsTable';
import CourseContent from './CourseContent';

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const [courseProgress, _setCourseProgress] = useState<number>(0);

  // Use the improved hook to fetch course data
  const { course, loading, error } = useCourse(courseId);

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

  // ✅ Backend Integration - Calcular progreso basado en datos reales
  const calculateProgress = () => {
    // Since we don't have modules/lessons data from the API yet,
    // we'll use a placeholder progress calculation
    // This should be replaced with real progress data from the backend
    return courseProgress || 0;
  };

  const actualProgress = calculateProgress();

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

  // TODO: Get actual user ID from auth context
  const userId = "user-uuid-123"; // Replace with actual user ID from context

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
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', flex: 1 }}>
              {course.titulo}
            </Typography>
            {/* {course. === 'youtube' && (
              <Chip 
                icon={<YouTubeIcon />} 
                label="YouTube" 
                color="error" 
                variant="outlined" 
                size="small"
              />
            )} */}
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {course.descripcion}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Duración:</strong> {formatDuration(course.duracion_estimada || 0)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Nivel:</strong> {course.nivel_dificultad}
          </Typography>

          {/* Mostrar objetivos del curso si existen
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
          )} */}

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
      <CourseContent courseId={courseId} usuarioId={userId} />

      {/* Sesiones de Estudio */}
      <StudySessionsTable courseId={courseId} usuarioId={userId} />

    </Box>
  );
}