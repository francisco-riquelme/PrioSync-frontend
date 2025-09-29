'use client';

import React, { useState } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Box,
  Typography,
  Autocomplete,
  IconButton
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { CourseMetadata, CourseLevel, Language } from '@/types/transcription';

interface MetadataFieldsProps {
  metadata: CourseMetadata;
  errors: Partial<CourseMetadata>;
  onChange: (updates: Partial<CourseMetadata>) => void;
  disabled?: boolean;
}

const COURSE_LEVELS: { value: CourseLevel; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' }
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'fr', label: 'Francés' },
  { value: 'de', label: 'Alemán' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Portugués' }
];

const COMMON_CATEGORIES = [
  'Programación',
  'Diseño',
  'Marketing',
  'Negocios',
  'Ciencias',
  'Matemáticas',
  'Idiomas',
  'Arte',
  'Música',
  'Historia',
  'Filosofía',
  'Psicología'
];

const COMMON_SUBJECTS = [
  'JavaScript',
  'Python',
  'React',
  'Node.js',
  'SQL',
  'HTML/CSS',
  'Photoshop',
  'Illustrator',
  'Marketing Digital',
  'Gestión de Proyectos',
  'Física',
  'Química',
  'Cálculo',
  'Álgebra',
  'Inglés',
  'Literatura'
];

const COMMON_AUDIENCES = [
  'Estudiantes universitarios',
  'Profesionales',
  'Principiantes',
  'Desarrolladores',
  'Diseñadores',
  'Gerentes',
  'Educadores',
  'Emprendedores'
];

export function MetadataFields({ metadata, errors, onChange, disabled }: MetadataFieldsProps) {
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: keyof CourseMetadata) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target ? event.target.value : event;
    onChange({ [field]: value });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      onChange({
        tags: [...metadata.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({
      tags: metadata.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Información básica */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Información Básica
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 2,
            mb: 2
          }}
        >
          <TextField
            fullWidth
            label="Título del Curso"
            value={metadata.title}
            onChange={handleInputChange('title')}
            error={!!errors.title}
            helperText={errors.title || 'Título descriptivo y claro del curso'}
            disabled={disabled}
            required
          />
          
          <TextField
            fullWidth
            label="Duración Estimada"
            value={metadata.duration}
            onChange={handleInputChange('duration')}
            error={!!errors.duration}
            helperText={errors.duration || 'Ej: 2 horas, 45 minutos'}
            disabled={disabled}
            placeholder="Ej: 2h 30min"
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Descripción del Curso"
          value={metadata.description}
          onChange={handleInputChange('description')}
          error={!!errors.description}
          helperText={errors.description || 'Descripción detallada del contenido y objetivos'}
          disabled={disabled}
          required
        />
      </Box>

      {/* Clasificación */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Clasificación
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2
          }}
        >
          <TextField
            fullWidth
            label="Instructor"
            value={metadata.instructor}
            onChange={handleInputChange('instructor')}
            error={!!errors.instructor}
            helperText={errors.instructor || 'Nombre del instructor o docente'}
            disabled={disabled}
            required
          />

          <Autocomplete
            freeSolo
            options={COMMON_CATEGORIES}
            value={metadata.category}
            onChange={(_, value) => onChange({ category: value || '' })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Categoría"
                error={!!errors.category}
                helperText={errors.category || 'Categoría principal del curso'}
                required
                disabled={disabled}
              />
            )}
          />

          <Autocomplete
            freeSolo
            options={COMMON_SUBJECTS}
            value={metadata.subject}
            onChange={(_, value) => onChange({ subject: value || '' })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Materia"
                error={!!errors.subject}
                helperText={errors.subject || 'Materia específica del curso'}
                required
                disabled={disabled}
              />
            )}
          />

          <Autocomplete
            freeSolo
            options={COMMON_AUDIENCES}
            value={metadata.targetAudience}
            onChange={(_, value) => onChange({ targetAudience: value || '' })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Audiencia Objetivo"
                error={!!errors.targetAudience}
                helperText={errors.targetAudience || 'Público objetivo del curso'}
                disabled={disabled}
              />
            )}
          />
        </Box>
      </Box>

      {/* Configuración */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Configuración
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2
          }}
        >
          <FormControl fullWidth error={!!errors.level}>
            <InputLabel>Nivel de Dificultad</InputLabel>
            <Select
              value={metadata.level}
              label="Nivel de Dificultad"
              onChange={handleInputChange('level')}
              disabled={disabled}
            >
              {COURSE_LEVELS.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.level || 'Nivel de complejidad del contenido'}
            </FormHelperText>
          </FormControl>

          <FormControl fullWidth error={!!errors.language}>
            <InputLabel>Idioma Principal</InputLabel>
            <Select
              value={metadata.language}
              label="Idioma Principal"
              onChange={handleInputChange('language')}
              disabled={disabled}
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.language || 'Idioma del contenido del video'}
            </FormHelperText>
          </FormControl>
        </Box>
      </Box>

      {/* Tags */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
          Etiquetas
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Agregar etiqueta"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Ej: JavaScript, Frontend, React"
          />
          <IconButton
            onClick={handleAddTag}
            disabled={disabled || !newTag.trim()}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {metadata.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={disabled ? undefined : () => handleRemoveTag(tag)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
        
        {metadata.tags.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Agrega etiquetas para mejorar la búsqueda y categorización del curso
          </Typography>
        )}
      </Box>
    </Box>
  );
}