'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { CalendarStudySessionFormData, StudySessionFormProps } from './componentTypes';

// Función auxiliar para formatear fecha en zona horaria local
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para parsear fecha en zona horaria local (evita UTC)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const StudySessionForm: React.FC<StudySessionFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingSession,
  selectedSlot
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CalendarStudySessionFormData>({
    startDate: '',
    startTime: '',
    endTime: ''
  });

  // Inicializar formulario cuando se abre
  useEffect(() => {
    if (open) {
      setError(null);
      
      if (editingSession) {
        // Modo edición
        const startDate = new Date(editingSession.startTime);
        const endDate = new Date(editingSession.endTime);
        
        setFormData({
          startDate: formatLocalDate(startDate),
          startTime: startDate.toTimeString().slice(0, 5),
          endTime: endDate.toTimeString().slice(0, 5)
        });
      } else if (selectedSlot) {
        // Nuevo evento con slot seleccionado
        const startDate = new Date(selectedSlot.start);
        const endDate = new Date(selectedSlot.end);
        
        setFormData({
          startDate: formatLocalDate(startDate),
          startTime: startDate.toTimeString().slice(0, 5),
          endTime: endDate.toTimeString().slice(0, 5)
        });
      } else {
        // Nuevo evento sin slot
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        
        setFormData({
          startDate: formatLocalDate(now),
          startTime: now.toTimeString().slice(0, 5),
          endTime: oneHourLater.toTimeString().slice(0, 5)
        });
      }
    }
  }, [open, editingSession, selectedSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.startDate || !formData.startTime || !formData.endTime) {
      setError('Todos los campos de fecha y hora son obligatorios');
      return;
    }

    // Validar que la hora de fin sea posterior a la de inicio
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);
    
    if (endDateTime <= startDateTime) {
      setError('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onSubmit(formData);
      if (!success) {
        setError('Error al guardar la sesión. Inténtalo de nuevo.');
      }
    } catch (err) {
      setError('Error al guardar la sesión. Inténtalo de nuevo.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        startDate: '',
        startTime: '',
        endTime: ''
      });
      setError(null);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle 
        component="div"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon color="primary" />
          <Typography variant="h6" component="h2">
            {editingSession ? 'Editar Sesión de Estudio' : 'Nueva Sesión de Estudio'}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          size="small"
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Fecha seleccionada (solo informativa) */}
            {formData.startDate && (
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  📅 Fecha seleccionada
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {parseLocalDate(formData.startDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            )}

            {/* Horarios */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Hora de inicio"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ flex: 1 }}
              />
              
              <TextField
                label="Hora de fin"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (editingSession ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StudySessionForm;