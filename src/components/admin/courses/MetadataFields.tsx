'use client';

import React, { useState, useEffect } from 'react';
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
  IconButton,
  Switch,
  SelectChangeEvent,
  FormControlLabel,
  Button,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Help as HelpIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import type { CourseMetadata, CourseLevel, Language } from '@/types/transcription';

interface MetadataFieldsProps {
  metadata: CourseMetadata;
  errors: Partial<CourseMetadata>;
  onChange: (updates: Partial<CourseMetadata>) => void;
  disabled?: boolean;
  autoSuggestions?: Partial<CourseMetadata>;
}

const DEFAULT_VALUES: CourseMetadata = {
  title: '',
  description: 'Contenido educativo sin descripción específica.',
  instructor: 'Instructor no especificado',
  category: 'General',
  level: 'beginner',
  duration: 'Duración no especificada',
  language: 'es',
  tags: ['video-educativo'],
  subject: 'Materia general',
  targetAudience: 'Audiencia general'
};

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

export function MetadataFields({ 
  metadata, 
  errors, 
  onChange, 
  disabled, 
  autoSuggestions 
}: MetadataFieldsProps) {
  const [useMinimalMode, setUseMinimalMode] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Aplicar sugerencias automáticas cuando estén disponibles
  useEffect(() => {
    if (autoSuggestions) {
      onChange(autoSuggestions);
    }
  }, [autoSuggestions, onChange]);

  const handleInputChange = (field: keyof CourseMetadata) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string
  ) => {
    const value = typeof event === 'string' ? event : event.target.value;
    onChange({ [field]: value });
  };

  const handleSelectChange = (field: keyof CourseMetadata) => (
    event: SelectChangeEvent<string>
  ) => {
    onChange({ [field]: event.target.value });
  };

  const handleUseDefaults = () => {
    const defaultsToApply = {
      ...DEFAULT_VALUES,
      title: metadata.title || DEFAULT_VALUES.title,
      duration: metadata.duration || DEFAULT_VALUES.duration
    };
    onChange(defaultsToApply);
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

  const requiredFields = ['title'];
  const completedRequired = requiredFields.filter(field => metadata[field as keyof CourseMetadata]).length;
  const optionalFields = ['description', 'instructor', 'category', 'subject', 'targetAudience'];
  const completedOptional = optionalFields.filter(field => metadata[field as keyof CourseMetadata]).length;

  return (
    <Box>
      {/* Controles superiores */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <FormControlLabel
          control={
            <Switch 
              checked={useMinimalMode} 
              onChange={(e) => setUseMinimalMode(e.target.checked)}
            />
          }
          label="Solo campos esenciales"
        />
        
        <Button 
          variant="outlined" 
          size="small"
          onClick={handleUseDefaults}
          startIcon={<HelpIcon />}
          disabled={disabled}
        >
          Usar Valores por Defecto
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* CAMPOS OBLIGATORIOS */}
        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', color: 'primary.main' }}>
            Campos Obligatorios
          </Typography>
          
          <TextField
            fullWidth
            label="Título del Curso *"
            value={metadata.title}
            onChange={handleInputChange('title')}
            error={!!errors.title}
            helperText={errors.title || 'Único campo obligatorio - se puede extraer del nombre del archivo'}
            disabled={disabled}
            required
          />
        </Box>

        {!useMinimalMode && (
          <>
            {/* Información básica */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Información Básica
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  multiline
                  rows={2}
                  label="Descripción"
                  value={metadata.description}
                  onChange={handleInputChange('description')}
                  helperText="Se puede generar automáticamente si se deja vacío"
                  disabled={disabled}
                  placeholder={DEFAULT_VALUES.description}
                />
                
                <TextField
                  label="Duración"
                  value={metadata.duration}
                  onChange={handleInputChange('duration')}
                  disabled={disabled}
                  placeholder="Se extrae automáticamente del video"
                />
              </Box>
            </Box>

            {/* Clasificación */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Clasificación
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Instructor"
                  value={metadata.instructor}
                  onChange={handleInputChange('instructor')}
                  disabled={disabled}
                  placeholder={DEFAULT_VALUES.instructor}
                />

                <Autocomplete
                  freeSolo
                  options={COMMON_CATEGORIES}
                  value={metadata.category}
                  onChange={(_, value) => onChange({ category: value || DEFAULT_VALUES.category })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Categoría"
                      placeholder={DEFAULT_VALUES.category}
                      disabled={disabled}
                    />
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={COMMON_SUBJECTS}
                  value={metadata.subject}
                  onChange={(_, value) => onChange({ subject: value || DEFAULT_VALUES.subject })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Materia"
                      placeholder={DEFAULT_VALUES.subject}
                      disabled={disabled}
                    />
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={COMMON_AUDIENCES}
                  value={metadata.targetAudience}
                  onChange={(_, value) => onChange({ targetAudience: value || DEFAULT_VALUES.targetAudience })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Audiencia Objetivo"
                      placeholder={DEFAULT_VALUES.targetAudience}
                      disabled={disabled}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Configuración */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Configuración Avanzada
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  endIcon={showOptionalFields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {showOptionalFields ? 'Ocultar' : 'Mostrar'}
                </Button>
              </Box>
              
              {showOptionalFields && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Nivel de Dificultad</InputLabel>
                    <Select
                      value={metadata.level}
                      label="Nivel de Dificultad"
                      onChange={handleSelectChange('level')}
                      disabled={disabled}
                    >
                      {COURSE_LEVELS.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          {level.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Idioma Principal</InputLabel>
                    <Select
                      value={metadata.language}
                      label="Idioma Principal"
                      onChange={handleSelectChange('language')}
                      disabled={disabled}
                    >
                      {LANGUAGES.map((lang) => (
                        <MenuItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>

            {/* Tags */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Etiquetas (Opcional)
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
                    size="small"
                  />
                ))}
              </Box>
              
              {metadata.tags.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Agrega etiquetas para mejorar la búsqueda y categorización del curso
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Resumen de campos completados */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Progreso:</strong> {completedRequired} de {requiredFields.length} campos obligatorios completados
          {!useMinimalMode && ` • ${completedOptional} de ${optionalFields.length} campos opcionales completados`}
        </Typography>
      </Alert>
    </Box>
  );
}