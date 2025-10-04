'use client';

import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Tabs, 
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  VideoFile as VideoFileIcon, 
  YouTube as YouTubeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';
import { CourseUploadForm } from '@/components/admin/courses/CourseUploadForm';
import { YouTubeImport, CourseStructurePreview } from '@/components/courses/youtube';
import type { YouTubePlaylist, GeneratedCourseStructure } from '@/types/youtube';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AdminCoursesUploadPage() {
  const [tabValue, setTabValue] = useState(0);
  const [currentPlaylist, setCurrentPlaylist] = useState<YouTubePlaylist | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePlaylistLoaded = (playlist: YouTubePlaylist) => {
    setCurrentPlaylist(playlist);
  };

  const handleCourseConfirmed = async (course: GeneratedCourseStructure) => {
    console.log('Curso confirmado:', course);
    
    try {
      // Enviar curso al backend para persistirlo
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: course.title,
          descripcion: course.description,
          duracion_estimada: course.estimatedDuration ? 
            parseEstimatedDuration(course.estimatedDuration) : 180, // convertir a minutos
          nivel_dificultad: course.level === 'beginner' ? 'basico' : 
                           course.level === 'advanced' ? 'avanzado' : 'intermedio',
          instructor: course.instructor,
          categoria: course.category,
          imagen_portada: currentPlaylist?.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
          estado: 'activo',
          // Metadatos adicionales del flujo de YouTube
          source: 'youtube',
          playlist_id: currentPlaylist?.id,
          generated_structure: course, // Guardar estructura completa para futura referencia
          tags: course.tags,
          objectives: course.objectives
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar el curso en el backend');
      }

      // Mostrar mensaje de éxito con información del backend
      setSuccessMessage(
        `Curso "${course.title}" creado y guardado exitosamente!\n` +
        `${course.modules.length} módulos y ${course.modules.reduce((total, module) => total + module.lessons.length, 0)} lecciones.\n` +
        `ID del curso: ${result.data.id_curso}\n` +
        `Ya está disponible en la página de cursos.`
      );
      setShowSuccessMessage(true);
      
      // Resetear el flujo
      setCurrentPlaylist(null);
      
    } catch (error: unknown) {
      console.error('Error al guardar el curso:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Mostrar error específico
      setSuccessMessage(
        `Error al guardar el curso: ${errorMessage}\n` +
        `El curso fue generado correctamente pero no se pudo guardar en el backend.`
      );
      setShowSuccessMessage(true);
    }
  };

  // Función auxiliar para convertir duración estimada a minutos
  const parseEstimatedDuration = (duration: string): number => {
    // Buscar patrones como "2 horas", "90 minutos", "1h 30m", etc.
    const hourMatch = duration.match(/(\d+)(?:\s*h(?:oras?)?)/i);
    const minuteMatch = duration.match(/(\d+)(?:\s*m(?:in(?:utos?)?)?)/i);
    
    let totalMinutes = 0;
    
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }
    
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }
    
    // Si no se pudo parsear, devolver un valor por defecto
    return totalMinutes > 0 ? totalMinutes : 180;
  };

  return (
    <AdminLayout 
      title="Administrador - Gestión de Cursos"
      subtitle="Crea cursos subiendo videos individuales o importando playlists completas de YouTube con estructura generada por IA."
    >
      <Container maxWidth="lg">
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box sx={{ p: 4, textAlign: 'center', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 2
              }}
            >
              Crear Nuevo Curso
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}
            >
              Elige cómo crear tu curso: sube videos individuales para transcripción con IA, 
              o importa una playlist completa de YouTube para generar automáticamente la estructura.
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="course creation options"
              variant="fullWidth"
            >
              <Tab 
                icon={<VideoFileIcon />}
                label="Subir Videos"
                iconPosition="start"
                sx={{ minHeight: 64, fontSize: '1rem' }}
              />
              <Tab 
                icon={<YouTubeIcon />}
                label="Importar de YouTube"
                iconPosition="start"
                sx={{ minHeight: 64, fontSize: '1rem' }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ p: 4 }}>
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Subir Videos para Transcripción
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sube videos individuales y genera transcripciones inteligentes con metadatos usando Gemini AI.
                </Typography>
              </Box>
              <CourseUploadForm />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Importar Playlist de YouTube
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Importa una playlist completa y genera automáticamente la estructura del curso con IA.
                </Typography>
              </Box>
              
              {!currentPlaylist ? (
                <YouTubeImport onPlaylistLoaded={handlePlaylistLoaded} />
              ) : (
                <CourseStructurePreview 
                  playlist={currentPlaylist}
                  onConfirmCourse={handleCourseConfirmed}
                />
              )}
            </TabPanel>
          </Box>
        </Paper>

        {/* Mensaje de éxito/error */}
        <Snackbar
          open={showSuccessMessage}
          autoHideDuration={8000}
          onClose={() => setShowSuccessMessage(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowSuccessMessage(false)} 
            severity={successMessage.includes('❌') ? 'error' : 'success'}
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': {
                whiteSpace: 'pre-line' // Permitir saltos de línea en el mensaje
              }
            }}
            icon={successMessage.includes('❌') ? undefined : <CheckCircleIcon />}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
}