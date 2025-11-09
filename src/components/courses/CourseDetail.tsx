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
} from '@mui/icons-material';

// Componente SVG para el ícono de WhatsApp
const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.577-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.264"/>
  </svg>
);
import { useCourseDetailData } from '@/components/courses/hooks/useCourseDetailData';
import { useProgresoCurso } from '@/components/courses/hooks/useProgresoCurso';
import { useCourseStudySessions } from '@/components/courses/hooks/useCourseStudySessions';
import { useEvaluacionCurso } from '@/hooks/useEvaluacionCurso';
import { useUser } from '@/contexts/UserContext';
import StudySessionsTable from './StudySessionsTable';
import CourseContent from './CourseContent';
import CourseFeedbackModal from './CourseFeedbackModal';
import { useCompartirCurso } from './hooks/useCompartirCurso';

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

  // Hook para compartir por WhatsApp
  const { crearCursoCompartido, generateWhatsAppUrl, loading: sharingLoading } = useCompartirCurso();

  // Función para compartir directamente por WhatsApp
  const handleWhatsAppShare = async () => {
    if (!userData?.usuarioId || !course) return;

    try {
      // Crear el curso compartido
      const shareData = await crearCursoCompartido({
        usuarioId: userData.usuarioId,
        cursoId: courseId,
      });

      if (shareData) {
        // Generar URL de WhatsApp y abrir
        const whatsappUrl = generateWhatsAppUrl(
          course.titulo,
          shareData.shareUrl,
          shareData.shareCode
        );
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error compartiendo curso:', error);
    }
  };

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
                  variant="contained"
                  size="small"
                  startIcon={sharingLoading ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
                  onClick={handleWhatsAppShare}
                  disabled={sharingLoading}
                  sx={{ 
                    textTransform: 'none',
                    backgroundColor: '#25D366',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#128C7E',
                    },
                    '&:disabled': {
                      backgroundColor: '#25D366',
                      opacity: 0.7,
                    }
                  }}
                >
                  {sharingLoading ? 'Compartiendo...' : 'Compartir por WhatsApp'}
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


    </Box>
  );
}