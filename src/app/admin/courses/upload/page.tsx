'use client';

import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import AdminLayout from '@/components/admin/AdminLayout';
import { CourseUploadForm } from '@/components/admin/courses/CourseUploadForm';

export default function AdminCoursesUploadPage() {
  return (
    <AdminLayout 
      title="Administrador - Cargar Videos"
      subtitle="Sube videos y completa los metadatos necesarios para generar transcripciones inteligentes usando Gemini AI 2.5 Flash."
    >
      <Container maxWidth="md">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
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
              Subir Curso para Transcripción
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
            >
              Carga un video y completa los metadatos necesarios para generar 
              una transcripción inteligente usando Gemini AI 2.5 Flash.
            </Typography>
          </Box>

          <CourseUploadForm />
        </Paper>
      </Container>
    </AdminLayout>
  );
}