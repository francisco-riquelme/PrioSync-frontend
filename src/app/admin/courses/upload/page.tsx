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

  const handleCourseConfirmed = (course: GeneratedCourseStructure) => {
    console.log('Curso confirmado:', course);
    
    // TODO: Aquí integrarías con tu API de backend para guardar el curso
    // Por ahora solo mostramos un mensaje de éxito
    setSuccessMessage(`Curso "${course.title}" creado exitosamente con ${course.modules.length} módulos y ${course.modules.reduce((total, module) => total + module.lessons.length, 0)} lecciones.`);
    setShowSuccessMessage(true);
    
    // Resetear el flujo
    setCurrentPlaylist(null);
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

        {/* Mensaje de éxito */}
        <Snackbar
          open={showSuccessMessage}
          autoHideDuration={6000}
          onClose={() => setShowSuccessMessage(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setShowSuccessMessage(false)} 
            severity="success" 
            sx={{ width: '100%' }}
            icon={<CheckCircleIcon />}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
}