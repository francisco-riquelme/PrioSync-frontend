


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
import { useMaterialEstudio } from './hooks/useMaterialEstudio';
import { getMaterialTypeLabelWithDefault, getMaterialTypeColor } from './courseUtils';

interface MaterialDetailProps {
  materialId: string;
}

export default function MaterialDetail({ materialId }: MaterialDetailProps) {
  const router = useRouter();
  const { material, loading, error } = useMaterialEstudio({ materialId });

  const handleBackClick = () => {
    if (material?.cursoId) {
      router.push(`/courses/${material.cursoId}`);
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

  // Handle material not found
  if (!material) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Material no encontrado
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

      {/* Material Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip 
            label={`Material ${material.orden || '-'}`} 
            color="primary" 
            size="small"
          />
          <Chip 
            label={getMaterialTypeLabelWithDefault(material.tipo)} 
            color={getMaterialTypeColor(material.tipo)} 
            size="small"
            variant="outlined"
          />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          {material.titulo}
        </Typography>

        {material.descripcion && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {material.descripcion}
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
        {material.url_contenido ? (
          <iframe
            src={material.url_contenido}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={material.titulo}
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
          Marcar como Completado
        </Button>
      </Box>
    </Box>
  );
}