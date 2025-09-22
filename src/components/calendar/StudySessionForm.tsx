'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Autocomplete,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Subject as SubjectIcon,
} from '@mui/icons-material';
import { StudySession, StudySessionFormData, PRIORITY_OPTIONS, REMINDER_OPTIONS, LOCATION_OPTIONS } from '@/types/studySession';
import { useUser } from '@/contexts/UserContext';

interface StudySessionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (sessionData: StudySessionFormData) => void;
  editingSession?: StudySession | null;
  selectedSlot?: { start: Date; end: Date; slots: Date[]; action: string } | null;
}

const StudySessionForm: React.FC<StudySessionFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingSession,
  selectedSlot
}) => {
  const { userData } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<StudySessionFormData>({
    title: '',
    subject: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    description: '',
    priority: 'medium',
    location: '',
    tags: [],
    reminder: 15
  });

  // Opciones para materias basadas en los cursos del usuario
  const subjectOptions = userData?.courses?.map(course => course.courseName) || [];

  useEffect(() => {
    if (editingSession) {
      // Llenar el formulario con datos de la sesión a editar
      const startDate = new Date(editingSession.startTime);
      const endDate = new Date(editingSession.endTime);
      
      setFormData({
        title: editingSession.title,
        subject: editingSession.subject,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        description: editingSession.description || '',
        priority: editingSession.priority,
        location: editingSession.location || '',
        tags: editingSession.tags || [],
        reminder: editingSession.reminder || 15
      });
    } else if (selectedSlot) {
      // Llenar con datos del slot seleccionado
      const startDate = new Date(selectedSlot.start);
      const endDate = new Date(selectedSlot.end);
      
      setFormData(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5)
      }));
    } else {
      // Resetear formulario
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData({
        title: '',
        subject: '',
        startDate: now.toISOString().split('T')[0],
        startTime: now.toTimeString().slice(0, 5),
        endDate: oneHourLater.toISOString().split('T')[0],
        endTime: oneHourLater.toTimeString().slice(0, 5),
        description: '',
        priority: 'medium',
        location: '',
        tags: [],
        reminder: 15
      });
    }
  }, [editingSession, selectedSlot, open]);

  const handleInputChange = (field: keyof StudySessionFormData, value: string | number | Date | boolean | string[]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setError(null);
    };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      handleInputChange('tags', [...(formData.tags || []), tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('El título es obligatorio');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('La materia es obligatoria');
      return false;
    }
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      setError('Las fechas y horas son obligatorias');
      return false;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch {
      setError('Error al guardar la sesión de estudio');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      subject: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      description: '',
      priority: 'medium',
      location: '',
      tags: [],
      reminder: 15
    });
    setTagInput('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SubjectIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">
            {editingSession ? 'Editar Sesión de Estudio' : 'Nueva Sesión de Estudio'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Título */}
          <TextField
            fullWidth
            label="Título de la sesión *"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ej: Repaso para examen de matemáticas"
            variant="outlined"
          />

          {/* Fila 1: Materia y Prioridad */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Autocomplete
              freeSolo
              options={subjectOptions}
              value={formData.subject}
              onChange={(_, newValue) => handleInputChange('subject', newValue || '')}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Materia *"
                  variant="outlined"
                  placeholder="Selecciona o escribe una materia"
                />
              )}
            />
            
            <FormControl sx={{ flex: 1 }} variant="outlined">
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                label="Prioridad"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: option.color
                        }}
                      />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Fila 2: Fechas de inicio */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha de inicio *"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ flex: 1 }}
            />
            
            <TextField
              fullWidth
              type="time"
              label="Hora de inicio *"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              variant="outlined"
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Fila 3: Fechas de fin */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha de fin *"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ flex: 1 }}
            />
            
            <TextField
              fullWidth
              type="time"
              label="Hora de fin *"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              variant="outlined"
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Fila 4: Ubicación y Recordatorio */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Autocomplete
              freeSolo
              options={LOCATION_OPTIONS}
              value={formData.location || ''}
              onChange={(_, newValue) => handleInputChange('location', newValue || '')}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ubicación"
                  variant="outlined"
                  placeholder="¿Dónde estudiarás?"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              )}
            />
            
            <FormControl sx={{ flex: 1 }} variant="outlined">
              <InputLabel>Recordatorio</InputLabel>
              <Select
                value={formData.reminder || 0}
                onChange={(e) => handleInputChange('reminder', Number(e.target.value))}
                label="Recordatorio"
              >
                {REMINDER_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Descripción */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe qué planeas estudiar en esta sesión..."
            variant="outlined"
          />

          {/* Tags */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Etiquetas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {formData.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Agregar etiqueta"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="examen, proyecto, repaso..."
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                size="small"
              >
                Agregar
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Guardando...' : editingSession ? 'Actualizar' : 'Crear Sesión'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudySessionForm;