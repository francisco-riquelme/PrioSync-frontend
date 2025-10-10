'use client';

import React from 'react';
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useLessonDetail } from './hooks/useLessonDetail';
import { getMaterialTypeLabel, getMaterialTypeColor, formatDuration } from './courseUtils';

interface LessonDetailProps {
  lessonId: string;
  cursoId?: string; // Make this optional since we can get it from the lesson data
}

export default function LessonDetail({ lessonId, cursoId }: LessonDetailProps) {
  const router = useRouter();
  const { leccion, curso, loading, error } = useLessonDetail({ 
    leccionId: lessonId
  });

  const handleBackClick = () => {
    // Use cursoId from lesson data if not provided as prop
    const targetCursoId = cursoId || curso?.cursoId;
    
    if (targetCursoId) {
      router.push(`/courses/${targetCursoId}`);
    } else {
      router.push('/courses');
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
    <Box>
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
      <Paper 
        elevation={2}
        sx={{ 
          width: '100%',
          height: { xs: '300px', sm: '400px', md: '600px' },
          mb: 4,
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {leccion.url_contenido ? (
          <iframe
            src={leccion.url_contenido}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={leccion.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Contenido no disponible
            </Typography>
          </Box>
        )}
      </Paper>

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
          color="success"
        >
          Marcar como Completada
        </Button>
      </Box>
    </Box>
  );
}
