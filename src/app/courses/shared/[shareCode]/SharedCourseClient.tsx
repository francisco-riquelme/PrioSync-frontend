'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useCompartirCurso } from '@/components/courses/hooks/useCompartirCurso';
import { useUser } from '@/contexts/UserContext';
import { CursoCompartidoData } from '@/types/share';

interface SharedCourseClientProps {
  params: Promise<{
    shareCode: string;
  }>;
}

export default function SharedCourseClient({ params }: SharedCourseClientProps) {
  const router = useRouter();
  const { userData } = useUser();
  const { shareCode } = use(params);
  
  const { 
    obtenerCursoCompartido, 
    inscribirseACursoCompartido,
    loading,
    error 
  } = useCompartirCurso();

  const [courseData, setCourseData] = useState<CursoCompartidoData | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!shareCode) return;
      
      try {
        const data = await obtenerCursoCompartido(shareCode);
        if (data) {
          setCourseData(data);
          
          // Verificar si ya está inscrito
          if (userData?.usuarioId && data.curso) {
            setAlreadyEnrolled(false);
          }
        }
      } catch (err) {
        console.error('Error cargando curso compartido:', err);
      }
    };

    loadData();
  }, [shareCode, userData?.usuarioId, obtenerCursoCompartido]);

  const handleEnrollment = async () => {
    if (!userData?.usuarioId || !courseData?.curso?.cursoId) {
      // Redirigir al login si no está autenticado
      router.push(`/auth/login?redirect=/courses/shared/${shareCode}`);
      return;
    }

    setIsEnrolling(true);

    try {
      const success = await inscribirseACursoCompartido({
        usuarioId: userData.usuarioId,
        cursoId: courseData.curso.cursoId,
      });

      if (success) {
        setEnrollmentSuccess(true);
        
        // Redirigir al curso después de unos segundos
        setTimeout(() => {
          router.push(`/courses/${courseData.curso.cursoId}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error inscribiéndose al curso:', err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours} horas`;
  };

  // Estados de carga y error
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2
      }}>
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Cargando curso compartido...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, px: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => router.push('/courses')}
          >
            Ir a Mis Cursos
          </Button>
        </Box>
      </Box>
    );
  }

  if (!courseData) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, px: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          No se encontró el curso compartido. El enlace puede haber expirado o ser inválido.
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => router.push('/courses')}
          >
            Ir a Mis Cursos
          </Button>
        </Box>
      </Box>
    );
  }

  const { curso, compartidoPor } = courseData;

  // Estado de éxito en inscripción
  if (enrollmentSuccess) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, px: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: 64, 
              color: 'success.main', 
              mb: 2 
            }} 
          />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            ¡Te has inscrito exitosamente!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Ahora puedes acceder a <strong>{curso.titulo}</strong> desde tu panel de cursos.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirigiendo al curso en unos momentos...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, px: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Curso Compartido
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {compartidoPor?.nombre} ha compartido este curso contigo
        </Typography>
      </Box>

      {/* Curso Card */}
      <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <CardMedia
            component="img"
            sx={{ 
              width: { xs: '100%', md: 300 }, 
              height: { xs: 200, md: 300 } 
            }}
            image={curso.imagen_portada || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop&auto=format'}
            alt={curso.titulo}
          />
          
          <CardContent sx={{ flex: 1, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SchoolIcon fontSize="large" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {curso.titulo}
                </Typography>
                <Chip
                  label={curso.nivel_dificultad}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {curso.descripcion}
            </Typography>

            {/* Información del curso */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {formatDuration(curso.duracion_estimada || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Compartido por {compartidoPor?.nombre}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Botón de acción */}
            {!userData ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleEnrollment}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              >
                Iniciar Sesión para Inscribirse
              </Button>
            ) : alreadyEnrolled ? (
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push(`/courses/${curso.cursoId}`)}
                fullWidth
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
              >
                Ver Curso (Ya Inscrito)
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleEnrollment}
                disabled={isEnrolling}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              >
                {isEnrolling ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                    Inscribiendo...
                  </>
                ) : (
                  'Inscribirse al Curso'
                )}
              </Button>
            )}
          </CardContent>
        </Box>
      </Card>

      {/* Información adicional */}
      <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          ¿Qué sucede al inscribirse?
        </Typography>
        <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
          <li>
            <Typography variant="body2">
              Tendrás acceso completo a todo el contenido del curso
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Podrás seguir tu propio progreso y ritmo de aprendizaje
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              El curso aparecerá en tu panel personal de cursos
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Podrás acceder desde cualquier dispositivo con tu cuenta
            </Typography>
          </li>
        </Box>
      </Paper>
    </Box>
  );
}