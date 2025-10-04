'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayCircleOutline as PlayCircleIcon,
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import type { 
  GeneratedCourseStructure, 
  CourseCustomization,
  CourseGenerationResponse,
  YouTubePlaylist
} from '@/types/youtube';

interface CourseStructurePreviewProps {
  playlist: YouTubePlaylist;
  onConfirmCourse: (course: GeneratedCourseStructure) => void;
  disabled?: boolean;
}

export function CourseStructurePreview({ 
  playlist, 
  onConfirmCourse, 
  disabled 
}: CourseStructurePreviewProps) {
  const [courseStructure, setCourseStructure] = useState<GeneratedCourseStructure | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customization, setCustomization] = useState<CourseCustomization>({});
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  // Generar estructura de curso
  const generateCourseStructure = async (customData?: CourseCustomization) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist,
          customization: customData || customization
        }),
      });

      const data: CourseGenerationResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Error al generar estructura del curso');
      }

      setCourseStructure(data.data);
      setProcessingTime(data.processingTime || null);
      
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error al generar estructura:', error);
      setGenerationError(error.message || 'Error al generar la estructura del curso');
    } finally {
      setIsGenerating(false);
    }
  };

  // Abrir diálogo de personalización
  const handleOpenCustomization = () => {
    setCustomization({
      title: courseStructure?.title || playlist.title,
      description: courseStructure?.description || '',
      category: courseStructure?.category || '',
      level: courseStructure?.level || 'intermediate',
      instructor: courseStructure?.instructor || playlist.channelTitle,
      targetAudience: courseStructure?.targetAudience || ''
    });
    setEditDialogOpen(true);
  };

  // Aplicar personalización
  const handleApplyCustomization = () => {
    setEditDialogOpen(false);
    generateCourseStructure(customization);
  };

  // Confirmar creación del curso
  const handleConfirmCourse = () => {
    if (courseStructure) {
      onConfirmCourse(courseStructure);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Botón para iniciar generación */}
      {!courseStructure && !isGenerating && (
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Generar Estructura del Curso
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Utiliza inteligencia artificial para crear automáticamente una estructura de curso 
              organizada en módulos y lecciones basada en la playlist de YouTube.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => generateCourseStructure()}
              disabled={disabled}
              startIcon={<SchoolIcon />}
            >
              Generar Estructura con IA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Indicador de progreso */}
      {isGenerating && (
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generando estructura del curso...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              La IA está analizando los {playlist.videos.length} videos de la playlist 
              para crear una estructura educativa optimizada.
            </Typography>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Este proceso puede tomar entre 30-60 segundos
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Error en generación */}
      {generationError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => generateCourseStructure()}
            >
              Reintentar
            </Button>
          }
        >
          <Typography variant="subtitle2">Error al generar estructura</Typography>
          <Typography variant="body2">{generationError}</Typography>
        </Alert>
      )}

      {/* Vista previa de la estructura generada */}
      {courseStructure && !isGenerating && (
        <Box>
          {/* Información general del curso */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {courseStructure.title}
                </Typography>
                <Tooltip title="Personalizar curso">
                  <IconButton onClick={handleOpenCustomization}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                {courseStructure.description}
              </Typography>

              {/* Metadatos del curso */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip 
                  icon={<PersonIcon />} 
                  label={`Instructor: ${courseStructure.instructor}`} 
                />
                <Chip 
                  icon={<CategoryIcon />} 
                  label={courseStructure.category}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  icon={<AccessTimeIcon />} 
                  label={courseStructure.estimatedDuration}
                  color="secondary"
                  variant="outlined"
                />
                <Chip 
                  label={courseStructure.level}
                  color={
                    courseStructure.level === 'beginner' ? 'success' :
                    courseStructure.level === 'intermediate' ? 'warning' : 'error'
                  }
                  variant="outlined"
                />
              </Box>

              {/* Tags */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Etiquetas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {courseStructure.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>

              {/* Objetivos del curso */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Objetivos del curso:
                </Typography>
                <List dense>
                  {courseStructure.objectives.map((objective, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircleIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={objective} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {processingTime && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Estructura generada en {(processingTime / 1000).toFixed(1)} segundos
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Módulos y lecciones */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estructura del Curso ({courseStructure.modules.length} módulos)
              </Typography>
              
              {courseStructure.modules.map((module, moduleIndex) => (
                <Accordion key={module.id} defaultExpanded={moduleIndex === 0}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`module-${module.id}-content`}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="h6" component="div">
                        Módulo {module.order}: {module.title}
                      </Typography>
                      <Chip 
                        label={`${module.lessons.length} lecciones`} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={module.estimatedDuration} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {module.description}
                    </Typography>
                    
                    <List>
                      {module.lessons.map((lesson, lessonIndex) => (
                        <React.Fragment key={lesson.id}>
                          <ListItem sx={{ alignItems: 'flex-start' }}>
                            <ListItemIcon>
                              <PlayCircleIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              disableTypography
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2">
                                    {lesson.order}. {lesson.title}
                                  </Typography>
                                  <Chip label={lesson.duration} size="small" variant="outlined" />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {lesson.description}
                                  </Typography>
                                  
                                  {lesson.objectives.length > 0 && (
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary" component="div">
                                        Objetivos:
                                      </Typography>
                                      <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
                                        {lesson.objectives.map((objective, objIndex) => (
                                          <Typography 
                                            key={objIndex} 
                                            component="li" 
                                            variant="caption" 
                                            color="text.secondary"
                                          >
                                            {objective}
                                          </Typography>
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                  
                                  {lesson.keyTopics.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {lesson.keyTopics.map((topic, topicIndex) => (
                                        <Chip 
                                          key={topicIndex} 
                                          label={topic} 
                                          size="small" 
                                          variant="outlined"
                                          sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {lessonIndex < module.lessons.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleOpenCustomization}
                  startIcon={<EditIcon />}
                >
                  Personalizar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirmCourse}
                  disabled={disabled}
                  startIcon={<CheckCircleIcon />}
                  size="large"
                >
                  Confirmar y Crear Curso
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Diálogo de personalización */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Personalizar Curso</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              fullWidth
              label="Título del Curso"
              value={customization.title || ''}
              onChange={(e) => setCustomization(prev => ({ ...prev, title: e.target.value }))}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción"
              value={customization.description || ''}
              onChange={(e) => setCustomization(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Categoría"
                value={customization.category || ''}
                onChange={(e) => setCustomization(prev => ({ ...prev, category: e.target.value }))}
              />
              
              <FormControl fullWidth>
                <InputLabel>Nivel</InputLabel>
                <Select
                  value={customization.level || 'intermediate'}
                  label="Nivel"
                  onChange={(e) => setCustomization(prev => ({ ...prev, level: e.target.value as any }))} // eslint-disable-line @typescript-eslint/no-explicit-any
                >
                  <MenuItem value="beginner">Principiante</MenuItem>
                  <MenuItem value="intermediate">Intermedio</MenuItem>
                  <MenuItem value="advanced">Avanzado</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              label="Instructor"
              value={customization.instructor || ''}
              onChange={(e) => setCustomization(prev => ({ ...prev, instructor: e.target.value }))}
            />
            
            <TextField
              fullWidth
              label="Audiencia Objetivo"
              value={customization.targetAudience || ''}
              onChange={(e) => setCustomization(prev => ({ ...prev, targetAudience: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApplyCustomization} 
            variant="contained" 
            startIcon={<SaveIcon />}
          >
            Aplicar y Regenerar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}