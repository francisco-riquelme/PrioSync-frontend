'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Alert,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AutoFixHigh as AutoFixHighIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import type { CourseMetadata } from '@/types/transcription';

interface MetadataAutofillProps {
  videoFile: File | null;
  extractedMetadata?: { title: string; duration: string };
  onSuggestionsGenerated: (suggestions: Partial<CourseMetadata>) => void;
  disabled?: boolean;
}

export function MetadataAutofill({ 
  videoFile, 
  extractedMetadata, 
  onSuggestionsGenerated,
  disabled 
}: MetadataAutofillProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<CourseMetadata> | null>(null);

  const generateSuggestions = async () => {
    if (!videoFile || !extractedMetadata) return;

    setIsGenerating(true);
    
    try {
      // Generar sugerencias basadas en el nombre del archivo y metadatos
      const filename = videoFile.name.toLowerCase();
      const title = extractedMetadata.title;
      
      const suggestedData: Partial<CourseMetadata> = {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        duration: extractedMetadata.duration,
        description: `Curso sobre ${title}. Contenido educativo con una duración de ${extractedMetadata.duration}.`,
        level: 'beginner',
        language: 'es',
        tags: [],
        instructor: '',
        category: '',
        subject: '',
        targetAudience: 'Estudiantes'
      };

      // Sugerir categoría basada en palabras clave del filename
      if (filename.includes('javascript') || filename.includes('js')) {
        suggestedData.category = 'Programación';
        suggestedData.subject = 'JavaScript';
        suggestedData.tags = ['JavaScript', 'Programación', 'Web'];
        suggestedData.description = `Curso de JavaScript. Aprende los fundamentos de este lenguaje de programación esencial para el desarrollo web. Duración: ${extractedMetadata.duration}.`;
      } else if (filename.includes('python')) {
        suggestedData.category = 'Programación';
        suggestedData.subject = 'Python';
        suggestedData.tags = ['Python', 'Programación'];
        suggestedData.description = `Curso de Python. Aprende uno de los lenguajes de programación más populares y versátiles. Duración: ${extractedMetadata.duration}.`;
      } else if (filename.includes('react')) {
        suggestedData.category = 'Programación';
        suggestedData.subject = 'React';
        suggestedData.tags = ['React', 'JavaScript', 'Frontend'];
        suggestedData.description = `Curso de React. Aprende a crear interfaces de usuario modernas con esta popular librería de JavaScript. Duración: ${extractedMetadata.duration}.`;
      } else if (filename.includes('design') || filename.includes('diseño')) {
        suggestedData.category = 'Diseño';
        suggestedData.subject = 'Diseño';
        suggestedData.tags = ['Diseño'];
        suggestedData.description = `Curso de diseño. Aprende principios y técnicas de diseño visual y conceptual. Duración: ${extractedMetadata.duration}.`;
      } else if (filename.includes('marketing')) {
        suggestedData.category = 'Marketing';
        suggestedData.subject = 'Marketing';
        suggestedData.tags = ['Marketing'];
        suggestedData.description = `Curso de marketing. Aprende estrategias y técnicas de marketing moderno. Duración: ${extractedMetadata.duration}.`;
      } else if (filename.includes('math') || filename.includes('matematica')) {
        suggestedData.category = 'Matemáticas';
        suggestedData.subject = 'Matemáticas';
        suggestedData.tags = ['Matemáticas'];
        suggestedData.description = `Curso de matemáticas. Aprende conceptos matemáticos fundamentales. Duración: ${extractedMetadata.duration}.`;
      }

      // Sugerir nivel basado en palabras clave
      if (filename.includes('basic') || filename.includes('intro') || filename.includes('fundamentals') || filename.includes('basico')) {
        suggestedData.level = 'beginner';
      } else if (filename.includes('advanced') || filename.includes('expert') || filename.includes('avanzado')) {
        suggestedData.level = 'advanced';
      } else if (filename.includes('intermediate') || filename.includes('intermedio')) {
        suggestedData.level = 'intermediate';
      }

      // Sugerir audiencia basada en categoría
      if (suggestedData.category === 'Programación') {
        suggestedData.targetAudience = 'Desarrolladores y estudiantes de programación';
      } else if (suggestedData.category === 'Diseño') {
        suggestedData.targetAudience = 'Diseñadores y creativos';
      } else if (suggestedData.category === 'Marketing') {
        suggestedData.targetAudience = 'Profesionales de marketing y emprendedores';
      }

      setSuggestions(suggestedData);

    } catch (error) {
      console.error('Error generando sugerencias:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestions = () => {
    if (suggestions) {
      onSuggestionsGenerated(suggestions);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity="info" 
        icon={<LightbulbIcon />}
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={generateSuggestions}
            disabled={disabled || !videoFile || isGenerating}
            startIcon={isGenerating ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
          >
            {isGenerating ? 'Generando...' : 'Generar Sugerencias'}
          </Button>
        }
      >
        <Typography variant="body2">
          ¿No tienes todos los metadatos? Puedo generar sugerencias automáticamente basadas en el nombre del archivo.
        </Typography>
      </Alert>

      {suggestions && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              Sugerencias Generadas
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2"><strong>Título:</strong> {suggestions.title}</Typography>
              <Typography variant="body2"><strong>Descripción:</strong> {suggestions.description}</Typography>
              <Typography variant="body2"><strong>Categoría:</strong> {suggestions.category}</Typography>
              <Typography variant="body2"><strong>Materia:</strong> {suggestions.subject}</Typography>
              <Typography variant="body2"><strong>Nivel:</strong> {suggestions.level}</Typography>
              <Typography variant="body2"><strong>Audiencia:</strong> {suggestions.targetAudience}</Typography>
              <Typography variant="body2"><strong>Etiquetas:</strong> {suggestions.tags?.join(', ')}</Typography>
              
              <Button 
                variant="outlined" 
                onClick={applySuggestions}
                sx={{ mt: 2, alignSelf: 'flex-start' }}
              >
                Aplicar Sugerencias
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}