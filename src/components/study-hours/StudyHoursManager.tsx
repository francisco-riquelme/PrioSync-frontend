'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useUser } from '@/contexts/UserContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { DaySchedule, TimeSlot, daysOfWeek, timeSlots } from '@/components/modals/welcome/types';
import { studyBlocksService } from '@/utils/services/studyBlocks';

export default function StudyHoursManager() {
  const router = useRouter();
  const { userData } = useUser();
  const { preferences, loading: preferencesLoading, refreshPreferences } = useUserPreferences(userData?.usuarioId);
  
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [overlapError, setOverlapError] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Cargar preferencias cuando estén disponibles
  useEffect(() => {
    console.log('🔍 [StudyHoursManager] useEffect triggered');
    console.log('📦 [StudyHoursManager] preferences:', preferences);
    console.log('📊 [StudyHoursManager] preferences.length:', preferences.length);
    
    if (preferences.length > 0) {
      console.log('✅ [StudyHoursManager] Setting schedule with preferences:', preferences);
      setSchedule(preferences);
    } else {
      console.warn('⚠️ [StudyHoursManager] No preferences found, initializing with empty days');
      // Inicializar con días vacíos si no hay preferencias
      setSchedule(daysOfWeek.map(day => ({ day: day.value, timeSlots: [] })));
    }
  }, [preferences]);

  // Obtener horarios de un día específico
  const getDaySchedule = (dayValue: string): DaySchedule | undefined => {
    // Normalizar ambos a minúsculas para la comparación (case-insensitive)
    const result = schedule.find(s => s.day.toLowerCase() === dayValue.toLowerCase());
    console.log(`🔎 [getDaySchedule] Buscando "${dayValue}" en schedule:`, {
      dayValue,
      scheduleLength: schedule.length,
      scheduleDays: schedule.map(s => s.day),
      found: result ? `✅ ${result.timeSlots.length} slots` : '❌ No encontrado'
    });
    return result;
  };

  // Función para detectar si dos rangos de tiempo se superponen
  const hasOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
    return (
      (slot1.start >= slot2.start && slot1.start < slot2.end) ||
      (slot1.end > slot2.start && slot1.end <= slot2.end) ||
      (slot1.start <= slot2.start && slot1.end >= slot2.end)
    );
  };

  // Obtener horas de fin válidas basadas en la hora de inicio
  const getValidEndTimes = (): string[] => {
    if (!startTime || !selectedDay) return timeSlots;
    
    const startIndex = timeSlots.indexOf(startTime);
    const daySchedule = getDaySchedule(selectedDay);
    
    return timeSlots.filter((time, index) => {
      if (index <= startIndex) return false;
      
      if (daySchedule) {
        for (const existingSlot of daySchedule.timeSlots) {
          if (existingSlot.start >= startTime && existingSlot.start < time) {
            return false;
          }
        }
      }
      
      return true;
    });
  };

  // Manejar clic en un día
  const handleDayClick = (dayValue: string) => {
    setSelectedDay(dayValue);
    setStartTime('');
    setEndTime('');
    setOverlapError('');
    setModalOpen(true);
  };

  // Agregar horario a un día
  const handleAddTimeSlot = () => {
    if (!startTime || !endTime) {
      setOverlapError('Debes seleccionar hora de inicio y fin');
      return;
    }

    const newSlot: TimeSlot = { start: startTime, end: endTime };
    const daySchedule = getDaySchedule(selectedDay);

    // Validar overlaps
    if (daySchedule) {
      for (const existingSlot of daySchedule.timeSlots) {
        if (hasOverlap(newSlot, existingSlot)) {
          setOverlapError('Este horario se superpone con uno existente');
          return;
        }
      }
    }

    // Agregar el nuevo slot
    setSchedule(prev => prev.map(day => {
      if (day.day === selectedDay) {
        return {
          ...day,
          timeSlots: [...day.timeSlots, newSlot].sort((a, b) => a.start.localeCompare(b.start))
        };
      }
      return day;
    }));

    // Limpiar y cerrar
    setStartTime('');
    setEndTime('');
    setOverlapError('');
  };

  // Eliminar horario de un día
  const handleRemoveTimeSlot = (dayValue: string, slotIndex: number) => {
    setSchedule(prev => prev.map(day => {
      if (day.day === dayValue) {
        return {
          ...day,
          timeSlots: day.timeSlots.filter((_, idx) => idx !== slotIndex)
        };
      }
      return day;
    }));
  };

  // Guardar cambios
  const handleSaveChanges = async () => {
    try {
      if (!userData?.usuarioId) {
        setSnackbarMessage('❌ Error: Usuario no autenticado');
        setSnackbarOpen(true);
        return;
      }

      // Guardar en backend usando el servicio
      const success = await studyBlocksService.updateUserStudyBlocks(
        userData.usuarioId,
        schedule
      );

      if (!success) {
        setSnackbarMessage('❌ Error al guardar en el backend');
        setSnackbarOpen(true);
        return;
      }

      // También guardar en localStorage como caché
      const savedData = localStorage.getItem('welcomeFormData');
      const existingData = savedData ? JSON.parse(savedData) : {};
      
      const updatedData = {
        ...existingData,
        tiempoDisponible: schedule
      };
      
      localStorage.setItem('welcomeFormData', JSON.stringify(updatedData));
      
      // Refrescar preferencias
      refreshPreferences();
      
      setSnackbarMessage('✅ Horarios guardados exitosamente');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      setSnackbarMessage('❌ Error al guardar los horarios');
      setSnackbarOpen(true);
    }
  };

  // Calcular total de horas configuradas
  const getTotalHours = (): number => {
    let totalMinutes = 0;
    schedule.forEach(day => {
      day.timeSlots.forEach(slot => {
        const [startHour, startMin] = slot.start.split(':').map(Number);
        const [endHour, endMin] = slot.end.split(':').map(Number);
        const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        totalMinutes += minutes;
      });
    });
    return totalMinutes / 60;
  };

  if (preferencesLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {[...Array(7)].map((_, idx) => (
            <Skeleton key={idx} variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            📅 Mis Horas de Estudio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura tus horarios disponibles para estudiar cada semana
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon />
          <strong>Total semanal:</strong> {getTotalHours().toFixed(1)} horas configuradas
        </Typography>
      </Box>

      {/* Grid de días */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {daysOfWeek.map((day) => {
          const daySchedule = getDaySchedule(day.value);
          const hasSlots = daySchedule && daySchedule.timeSlots.length > 0;

          return (
            <Card
              key={day.value}
              onClick={() => handleDayClick(day.value)}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: '2px solid',
                borderColor: hasSlots ? 'primary.main' : 'divider',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: 'primary.main',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {day.label}
                  </Typography>
                  <Chip
                    label={daySchedule?.timeSlots.length || 0}
                    color={hasSlots ? 'primary' : 'default'}
                    size="small"
                  />
                </Box>

                {hasSlots ? (
                  <Stack spacing={1}>
                    {daySchedule!.timeSlots.map((slot, idx) => (
                      <Chip
                        key={idx}
                        label={`${slot.start} - ${slot.end}`}
                        onDelete={(e) => {
                          e.stopPropagation();
                          handleRemoveTimeSlot(day.value, idx);
                        }}
                        deleteIcon={<DeleteIcon />}
                        color="primary"
                        variant="outlined"
                        sx={{ justifyContent: 'space-between' }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Sin horarios configurados
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Modal para agregar horarios */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6">
              Agregar horario - {daysOfWeek.find(d => d.value === selectedDay)?.label}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {overlapError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {overlapError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Hora de inicio</InputLabel>
              <Select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setEndTime('');
                  setOverlapError('');
                }}
                label="Hora de inicio"
              >
                {timeSlots.map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!startTime}>
              <InputLabel>Hora de fin</InputLabel>
              <Select
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setOverlapError('');
                }}
                label="Hora de fin"
              >
                {getValidEndTimes().map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Mostrar horarios existentes del día */}
          {getDaySchedule(selectedDay)?.timeSlots && getDaySchedule(selectedDay)!.timeSlots.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Horarios actuales:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {getDaySchedule(selectedDay)?.timeSlots.map((slot, idx) => (
                  <Chip
                    key={idx}
                    label={`${slot.start} - ${slot.end}`}
                    size="small"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddTimeSlot}
            disabled={!startTime || !endTime}
            startIcon={<AddIcon />}
          >
            Agregar Horario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Botón guardar cambios (flotante) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveChanges}
          startIcon={<CheckCircleIcon />}
          sx={{
            boxShadow: 4,
            '&:hover': {
              boxShadow: 8,
            },
          }}
        >
          Guardar Cambios
        </Button>
      </Box>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
