'use client';

import React, { useState } from 'react';
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
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Feedback as FeedbackIcon,
  Star as StarIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useCourseDetailData } from '@/components/courses/hooks/useCourseDetailData';
import { useProgresoCurso } from '@/components/courses/hooks/useProgresoCurso';
import { useCourseStudySessions } from '@/components/courses/hooks/useCourseStudySessions';
import { useEvaluacionCurso } from '@/hooks/useEvaluacionCurso';
import { useUser } from '@/contexts/UserContext';
import StudySessionsTable from './StudySessionsTable';
import CourseContent from './CourseContent';
import CourseFeedbackModal from './CourseFeedbackModal';
import ShareCourseModal from './ShareCourseModal';

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const { userData } = useUser();

  // Fetch all course data with the new unified hook
  const { course, modulos, materiales, quizzes, loading, error, refreshCourseData } = useCourseDetailData({ cursoId: courseId });

  // Debug: Log quiz data
  console.log('🎯 CourseDetail - quizzes:', quizzes);
  console.log('🎯 CourseDetail - quizzes length:', quizzes?.length || 0);

  // Create refresh callback with debugging
  const handleQuizCreated = () => {
    console.log('🔄 CourseDetail - Quiz created, refreshing course data...');
    refreshCourseData();
  };

  // Fetch study sessions for this course
  const { 
    sessions: courseSessions, 
    loading: sessionsLoading
  } = useCourseStudySessions({ 
    cursoId: courseId, 
    usuarioId: userData?.usuarioId 
  });

  // Calcular progreso del curso
  const {
    progreso,
    leccionesCompletadas,
    totalLecciones,
  } = useProgresoCurso({
    modulos,
    usuarioId: userData?.usuarioId || '',
  });

  // Hook para manejar evaluaciones del curso
  const {
    evaluacion,
    loading: evaluacionLoading,
    saving: evaluacionSaving,
    guardarEvaluacion,
  } = useEvaluacionCurso({
    cursoId: courseId,
    usuarioId: userData?.usuarioId,
  });

  // Estado del modal de feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Estado del modal de compartir
  const [shareModalOpen, setShareModalOpen] = useState(false);

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

  // Handler para abrir modal de feedback
  const handleCourseFeedback = () => {
    setFeedbackModalOpen(true);
  };

  // Handler para guardar evaluación
  const handleSaveEvaluacion = async (data: { calificacion: number; comentario: string }) => {
    const success = await guardarEvaluacion(data);
    return success;
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
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {!evaluacionLoading && evaluacion && (
                  <Chip
                    icon={<StarIcon />}
                    label={`${evaluacion.calificacion}/5`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ShareIcon />}
                  onClick={() => setShareModalOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Compartir
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FeedbackIcon />}
                  onClick={handleCourseFeedback}
                  sx={{ textTransform: 'none' }}
                >
                  {evaluacion ? 'Editar Evaluación' : 'Evaluar Curso'}
                </Button>
              </Box>
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
        onQuizCreated={handleQuizCreated}
        onMaterialCreated={refreshCourseData}
        cursoId={courseId}
      />

      {/* Sesiones de Estudio */}
      <StudySessionsTable sessions={courseSessions} loading={sessionsLoading} />

      {/* Modal de Feedback/Evaluación */}
      <CourseFeedbackModal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleSaveEvaluacion}
        courseTitle={course?.titulo || 'Curso'}
        initialData={{
          calificacion: evaluacion?.calificacion ?? undefined,
          comentario: evaluacion?.comentario ?? undefined,
        }}
        saving={evaluacionSaving}
      />

      {/* Modal de Compartir Curso */}
      <ShareCourseModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        courseId={courseId}
        courseTitle={course?.titulo || 'Curso'}
      />
    </Box>
  );
}