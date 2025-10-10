'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Check as CheckIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useLessonDetail } from './hooks/useLessonDetail';
import { useProgresoLeccion } from './hooks/useProgresoLeccion';
import { useUser } from '@/contexts/UserContext';
import { getMaterialTypeLabel, getMaterialTypeColor, formatDuration } from './courseUtils';

// Función para convertir URL de YouTube a URL de embed
const convertToYouTubeEmbed = (url: string): string => {
  if (!url) return '';
  
  // Si ya es una URL de embed, devolverla tal como está
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Extraer el ID del video de diferentes formatos de YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // Si no se puede convertir, devolver la URL original
  return url;
};

interface LessonDetailProps {
  lessonId: string;
  cursoId?: string; // Make this optional since we can get it from the lesson data
}

export default function LessonDetail({ lessonId, cursoId }: LessonDetailProps) {
  const router = useRouter();
  const { userData } = useUser();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [showNextButton, setShowNextButton] = useState(false);
  
  const { leccion, modulo, curso, loading, error } = useLessonDetail({ 
    leccionId: lessonId
  });


  // Hook de progreso de lección
  const {
    isCompleted,
    loading: progresoLoading,
    marcarCompletada,
  } = useProgresoLeccion({
    leccionId: lessonId,
    usuarioId: userData?.usuarioId || '',
  });

  // Encontrar la siguiente lección (puede estar en el mismo módulo o en el siguiente)
  const getSiguienteLeccion = () => {
    if (!modulo || !modulo.Lecciones || !leccion || !curso) return null;
    
        // Ordenar lecciones del módulo actual por orden
        const leccionesOrdenadas = [...modulo.Lecciones].sort((a, b) => 
          (a.orden || 0) - (b.orden || 0)
        );
    
    // Encontrar la posición actual en el módulo
    const indiceActual = leccionesOrdenadas.findIndex((l) => l.leccionId === lessonId);
    
    // Si hay una siguiente lección en el mismo módulo, devolverla
    if (indiceActual !== -1 && indiceActual < leccionesOrdenadas.length - 1) {
      return leccionesOrdenadas[indiceActual + 1];
    }
    
    // Si es la última lección del módulo, buscar en el siguiente módulo
    if (curso.Modulos && curso.Modulos.length > 0) {
          // Ordenar módulos por orden
          const modulosOrdenados = [...curso.Modulos].sort((a, b) => 
            (a.orden || 0) - (b.orden || 0)
          );
      
      // Encontrar el índice del módulo actual
      const indiceModuloActual = modulosOrdenados.findIndex((m) => m.moduloId === modulo.moduloId);
      
      // Si hay un siguiente módulo
      if (indiceModuloActual !== -1 && indiceModuloActual < modulosOrdenados.length - 1) {
        const siguienteModulo = modulosOrdenados[indiceModuloActual + 1];
        
            // Si el siguiente módulo tiene lecciones, devolver la primera
            if (siguienteModulo.Lecciones && siguienteModulo.Lecciones.length > 0) {
              const primeraLeccionSiguienteModulo = [...siguienteModulo.Lecciones]
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))[0];
              return primeraLeccionSiguienteModulo;
            }
      }
    }
    
    return null;
  };

      const siguienteLeccion = getSiguienteLeccion();
      
      // Determinar si la siguiente lección está en otro módulo
      const isSiguienteLeccionEnOtroModulo = () => {
        if (!siguienteLeccion || !modulo) return false;
        
        // Verificar si la siguiente lección pertenece al mismo módulo
        const leccionesDelModuloActual = modulo.Lecciones || [];
        return !leccionesDelModuloActual.some((l) => l.leccionId === siguienteLeccion.leccionId);
      };
  
  const esSiguienteModulo = isSiguienteLeccionEnOtroModulo();

  const handleBackClick = () => {
    // Use cursoId from lesson data if not provided as prop
    const targetCursoId = cursoId || curso?.cursoId;
    
    if (targetCursoId) {
      router.push(`/courses/${targetCursoId}`);
    } else {
      router.push('/courses');
    }
  };

  // Manejar marcar lección como completada
  const handleMarcarCompletada = async () => {
    try {
      await marcarCompletada();
      setShowSuccessMessage(true);
      // Mostrar botón de siguiente lección si existe
      if (siguienteLeccion) {
        setShowNextButton(true);
      }
    } catch (err) {
      console.error('Error al marcar lección como completada:', err);
    }
  };

      // Navegar a la siguiente lección
      const handleSiguienteLeccion = () => {
        if (siguienteLeccion) {
          router.push(`/courses/lecciones/${siguienteLeccion.leccionId}`);
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
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  // Handle lesson not found
  if (!leccion) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Lección no encontrada
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Botón flotante: Siguiente Lección */}
      {(showNextButton || isCompleted) && siguienteLeccion && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 80, md: 100 },
            right: { xs: 16, md: 24 },
            zIndex: 1000,
          }}
        >
          <Button
            variant="contained"
            color="success"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleSiguienteLeccion}
            sx={{
              boxShadow: 4,
              '&:hover': {
                boxShadow: 6,
              },
              fontWeight: 600,
              px: 3,
              py: 1.5,
            }}
          >
            {esSiguienteModulo ? 'Siguiente Módulo' : 'Siguiente Lección'}
          </Button>
        </Box>
      )}

      {/* Header con botón de regreso */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackClick} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Volver al Curso
        </Typography>
      </Box>

      {/* Lesson Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label={`Lección ${leccion.orden || '-'}`} 
            color="primary" 
            size="small"
          />
          <Chip 
            label={getMaterialTypeLabel(leccion.tipo)} 
            color={getMaterialTypeColor(leccion.tipo)} 
            size="small"
            variant="outlined"
          />
          <Chip 
            label={formatDuration(leccion.duracion_minutos)} 
            size="small"
            variant="outlined"
          />
          {isCompleted && (
            <Chip 
              icon={<CheckIcon />}
              label="Completada" 
              color="success" 
              size="small"
            />
          )}
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          {leccion.titulo}
        </Typography>

        {leccion.descripcion && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {leccion.descripcion}
          </Typography>
        )}
      </Box>

      {/* Resource Viewer - Large White Box */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mb: 4 
      }}>
        <Paper 
          elevation={2}
          sx={{ 
            width: { xs: '100%', sm: '98%', md: '90%', lg: '85%' },
            maxWidth: '1100px',
            height: { xs: '380px', sm: '480px', md: '580px' },
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
        {leccion.url_contenido ? (
          <>
            {videoLoading && (
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                color: 'white',
                textAlign: 'center'
              }}>
                <CircularProgress color="inherit" />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Cargando video...
                </Typography>
              </Box>
            )}
            <iframe
              src={convertToYouTubeEmbed(leccion.url_contenido)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                opacity: videoLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
              title={leccion.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              onLoad={() => setVideoLoading(false)}
              onError={() => setVideoLoading(false)}
            />
          </>
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Contenido no disponible
            </Typography>
          </Box>
        )}
        </Paper>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
        >
          Volver al Curso
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon />}
          color={isCompleted ? 'primary' : 'success'}
          onClick={handleMarcarCompletada}
          disabled={isCompleted || progresoLoading}
        >
          {isCompleted ? 'Completada' : 'Marcar como Completada'}
        </Button>
      </Box>

      {/* Mensaje de éxito */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          ¡Lección marcada como completada!
        </Alert>
      </Snackbar>
    </Box>
  );
}
