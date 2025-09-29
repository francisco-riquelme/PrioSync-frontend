'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  VideoFile as VideoFileIcon,
  Send as SendIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { VideoUpload } from './VideoUpload';
import { MetadataFields } from './MetadataFields';
import { MetadataAutofill } from './MetadataAutofill';
import { TranscriptionProgress } from './TranscriptionProgress';
import type { CourseMetadata, TranscriptionJobStatus } from '@/types/transcription';

interface FormData extends CourseMetadata {
  videoFile: File | null;
}

interface FormErrors extends Partial<Omit<CourseMetadata, 'tags'>> {
  videoFile?: string;
  tags?: string;
}

const initialFormData: FormData = {
  videoFile: null,
  title: '',
  description: '',
  instructor: '',
  category: '',
  level: 'beginner',
  duration: '',
  language: 'es',
  tags: [],
  subject: '',
  targetAudience: ''
};

export function CourseUploadForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscriptionJobStatus | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [extractedVideoMetadata, setExtractedVideoMetadata] = useState<{title: string, duration: string} | null>(null);

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.videoFile) {
      newErrors.videoFile = 'Debe seleccionar un archivo de video';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    // Aplicar valores por defecto para campos opcionales vacíos
    const defaultFormData = {
      description: formData.description || 'Contenido educativo sin descripción específica.',
      instructor: formData.instructor || 'Instructor no especificado',
      category: formData.category || 'General',
      subject: formData.subject || 'Materia general',
      targetAudience: formData.targetAudience || 'Audiencia general'
    };

    // Actualizar form data con valores por defecto
    setFormData(prev => ({ ...prev, ...defaultFormData }));

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejo de la subida del archivo
  const handleFileSelect = (file: File | null) => {
    setFormData(prev => ({ ...prev, videoFile: file }));
    if (file && errors.videoFile) {
      setErrors(prev => ({ ...prev, videoFile: undefined }));
    }
  };

  // Manejo de metadatos extraídos del video
  const handleMetadataExtracted = (metadata: {title: string, duration: string}) => {
    setExtractedVideoMetadata(metadata);
    // Aplicar automáticamente el título si no existe
    if (!formData.title) {
      setFormData(prev => ({
        ...prev,
        title: metadata.title,
        duration: metadata.duration
      }));
    }
  };

  // Manejo de sugerencias generadas
  const handleSuggestionsGenerated = (suggestions: Partial<CourseMetadata>) => {
    setFormData(prev => ({ ...prev, ...suggestions }));
  };

  // Manejo de cambios en metadatos
  const handleMetadataChange = (updates: Partial<CourseMetadata>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Limpiar errores de campos que se están editando
    const updatedErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      if (updatedErrors[key as keyof FormErrors]) {
        delete updatedErrors[key as keyof FormErrors];
      }
    });
    setErrors(updatedErrors);
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('video', formData.videoFile!);
      
      // Agregar metadatos requeridos por la API existente
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('courseId', `course_${Date.now()}`); // Generar ID único
      formDataToSend.append('courseName', `${formData.category} - ${formData.subject}`);
      
      // Agregar metadatos adicionales como JSON
      const additionalMetadata = {
        instructor: formData.instructor,
        category: formData.category,
        level: formData.level,
        duration: formData.duration,
        language: formData.language,
        tags: formData.tags,
        subject: formData.subject,
        targetAudience: formData.targetAudience
      };
      
      formDataToSend.append('metadata', JSON.stringify(additionalMetadata));

      const response = await fetch('/api/transcribe-course', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`Error al subir el archivo: ${response.statusText}`);
      }

      const result = await response.json();
      setCurrentRequestId(result.requestId);
      
      // Crear status inicial basado en la respuesta
      const initialStatus: TranscriptionJobStatus = {
        requestId: result.requestId,
        status: 'processing',
        progress: 10,
        timestamp: new Date().toISOString()
      };
      
      setTranscriptionStatus(initialStatus);

    } catch (error) {
      console.error('Error al procesar el video:', error);
      setTranscriptionStatus({
        requestId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset del formulario
  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setTranscriptionStatus(null);
    setCurrentRequestId(null);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Información sobre límites */}
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        <Typography variant="body2">
          <strong>Límites:</strong> Archivos de video hasta 100MB. 
          Formatos soportados: MP4, AVI, MOV, WMV, MKV.
          La transcripción utiliza Gemini 2.5 Flash para análisis inteligente del contenido educativo.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Sección de carga de video */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoFileIcon color="primary" />
            Archivo de Video
          </Typography>
          <VideoUpload
            onFileSelect={handleFileSelect}
            onMetadataExtracted={handleMetadataExtracted}
            error={errors.videoFile}
            disabled={isSubmitting}
          />
        </Paper>

        {/* Sección de metadatos */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            Metadatos del Curso
          </Typography>
          <MetadataAutofill
            videoFile={formData.videoFile}
            extractedMetadata={extractedVideoMetadata || undefined}
            onSuggestionsGenerated={handleSuggestionsGenerated}
            disabled={isSubmitting}
          />
          
          <MetadataFields
            metadata={formData}
            errors={errors as Partial<CourseMetadata>}
            onChange={handleMetadataChange}
            disabled={isSubmitting}
          />
        </Paper>

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={isSubmitting}
            size="large"
          >
            Limpiar Formulario
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !formData.videoFile}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {isSubmitting ? 'Procesando...' : 'Iniciar Transcripción'}
          </Button>
        </Box>

        {/* Progreso de transcripción */}
        {transcriptionStatus && (
          <TranscriptionProgress
            status={transcriptionStatus}
            requestId={currentRequestId}
            onStatusUpdate={setTranscriptionStatus}
          />
        )}
      </Box>
    </Box>
  );
}