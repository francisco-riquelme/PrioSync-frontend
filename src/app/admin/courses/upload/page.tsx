'use client';

import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import AdminLayout from '@/components/admin/AdminLayout';
import { CourseUploadForm } from '@/components/admin/courses/CourseUploadForm';

export default function AdminCoursesUploadPage() {
  return (
    <AdminLayout 
      title="Administrador - Cargar Videos"
      subtitle="Sube videos para generar transcripciones automáticamente"
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              component="h1" 
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
              sx={{ maxWidth: '600px', mx: 'auto' }}
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