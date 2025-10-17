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
import { useStudyBlocks } from '@/hooks/useStudyBlocks';
import { DaySchedule, TimeSlot, daysOfWeek, timeSlots } from '@/components/modals/welcome/types';

export default function StudyHoursManager() {
  const router = useRouter();
  const { userData } = useUser();
  const { daySchedules, loading: studyBlocksLoading, createSingleBlock, deleteSingleBlock, updateSingleBlock } = useStudyBlocks({ usuarioId: userData?.usuarioId });
  
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [overlapError, setOverlapError] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [editingSlot, setEditingSlot] = useState<{ day: string; slot: TimeSlot; index: number } | null>(null);

  // Cargar horarios cuando estén disponibles
  useEffect(() => {
    if (daySchedules.length > 0) {
      setSchedule(daySchedules);
    } else {
      // Inicializar con días vacíos si no hay horarios
      setSchedule(daysOfWeek.map(day => ({ day: day.value, timeSlots: [] })));
    }
  }, [daySchedules]);

  // Obtener horarios de un día específico
  const getDaySchedule = (dayValue: string): DaySchedule | undefined => {
    return schedule.find(s => s.day === dayValue);
  };

  // Función para detectar si dos rangos de tiempo se superponen
  const hasOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
    return (
      (slot1.start >= slot2.start && slot1.start < slot2.end) ||
      (slot1.end > slot2.start && slot1.end <= slot2.end) ||
      (slot1.start <= slot2.start && slot1.end >= slot2.end)
    );
  };

  // Get all time slots (show all options with scrolling)
  const getAllTimeSlots = (): string[] => {
    return timeSlots; // Return all 48 time slots
  };

  // Obtener horas de fin válidas basadas en la hora de inicio
  const getValidEndTimes = (): string[] => {
    if (!startTime || !selectedDay) return getAllTimeSlots();
    
    const startIndex = timeSlots.indexOf(startTime);
    const daySchedule = getDaySchedule(selectedDay);
    
    return timeSlots.filter((time, index) => {
      if (index <= startIndex) return false;
      
      if (daySchedule) {
        for (let i = 0; i < daySchedule.timeSlots.length; i++) {
          const existingSlot = daySchedule.timeSlots[i];
          // Skip overlap check with the slot being edited
          if (editingSlot && i === editingSlot.index) continue;
          
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
    setEditingSlot(null); // Clear edit mode
    setOverlapError('');
    setModalOpen(true);
  };

  // Manejar edición de un horario existente
  const handleEditTimeSlot = (dayValue: string, slot: TimeSlot, index: number) => {
    setSelectedDay(dayValue);
    setStartTime(slot.start);
    setEndTime(slot.end);
    setEditingSlot({ day: dayValue, slot, index });
    setOverlapError('');
    setModalOpen(true);
  };

  // Agregar horario a un día
  const handleAddTimeSlot = async () => {
    if (!startTime || !endTime) {
      setOverlapError('Debes seleccionar hora de inicio y fin');
      return;
    }

    const newSlot: TimeSlot = { start: startTime, end: endTime };
    const daySchedule = getDaySchedule(selectedDay);

    // Validar overlaps (skip the slot being edited)
    if (daySchedule) {
      for (let i = 0; i < daySchedule.timeSlots.length; i++) {
        const existingSlot = daySchedule.timeSlots[i];
        // Skip overlap check with the slot being edited
        if (editingSlot && i === editingSlot.index) continue;
        
        if (hasOverlap(newSlot, existingSlot)) {
          setOverlapError('Este horario se superpone con uno existente');
          return;
        }
      }
    }

    let success = false;

    if (editingSlot) {
      // UPDATE MODE
      // Optimistic update
      const updatedSchedule = schedule.map(day => {
        if (day.day === selectedDay) {
          return {
            ...day,
            timeSlots: day.timeSlots.map((slot, idx) => 
              idx === editingSlot.index ? newSlot : slot
            ).sort((a, b) => a.start.localeCompare(b.start))
          };
        }
        return day;
      });

      setSchedule(updatedSchedule);

      // Update in backend
      success = await updateSingleBlock(selectedDay, editingSlot.slot, newSlot);
      
      if (!success) {
        // Revert optimistic update on error
        setSchedule(schedule);
        setSnackbarMessage('❌ Error al actualizar el horario');
      } else {
        setSnackbarMessage('✅ Horario actualizado exitosamente');
      }
    } else {
      // CREATE MODE
      // Optimistic update
      const updatedSchedule = schedule.map(day => {
        if (day.day === selectedDay) {
          return {
            ...day,
            timeSlots: [...day.timeSlots, newSlot].sort((a, b) => a.start.localeCompare(b.start))
          };
        }
        return day;
      });

      setSchedule(updatedSchedule);

      // Save to backend
      success = await createSingleBlock(selectedDay, newSlot);
      
      if (!success) {
        // Revert optimistic update on error
        setSchedule(schedule);
        setSnackbarMessage('❌ Error al guardar el horario');
      } else {
        setSnackbarMessage('✅ Horario agregado exitosamente');
      }
    }
    
    setSnackbarOpen(true);

    // Limpiar y cerrar
    setStartTime('');
    setEndTime('');
    setOverlapError('');
    setEditingSlot(null);
    setModalOpen(false);
  };

  // Eliminar horario de un día
  const handleRemoveTimeSlot = async (dayValue: string, slotIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening edit modal
    
    const daySchedule = getDaySchedule(dayValue);
    const slotToRemove = daySchedule?.timeSlots[slotIndex];
    
    if (!slotToRemove) return;

    // Optimistic update
    const updatedSchedule = schedule.map(day => {
      if (day.day === dayValue) {
        return {
          ...day,
          timeSlots: day.timeSlots.filter((_, idx) => idx !== slotIndex)
        };
      }
      return day;
    });

    setSchedule(updatedSchedule);

    // Delete from backend
    const success = await deleteSingleBlock(dayValue, slotToRemove);
    
    if (!success) {
      // Revert optimistic update on error
      setSchedule(schedule);
      setSnackbarMessage('❌ Error al eliminar el horario');
    } else {
      setSnackbarMessage('✅ Horario eliminado exitosamente');
    }
    setSnackbarOpen(true);
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

  if (studyBlocksLoading) {
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
                minHeight: '200px', // Make cards taller to show multiple study blocks
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: 'primary.main',
                },
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

                <Box sx={{ flex: 1 }}>
                  {hasSlots ? (
                    <Stack spacing={1}>
                      {daySchedule!.timeSlots.map((slot, idx) => (
                        <Chip
                          key={idx}
                          label={`${slot.start} - ${slot.end}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTimeSlot(day.value, slot, idx);
                          }}
                          onDelete={(e) => {
                            handleRemoveTimeSlot(day.value, idx, e);
                          }}
                          deleteIcon={<DeleteIcon />}
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Sin horarios configurados
                    </Typography>
                  )}
                </Box>
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
              {editingSlot ? 'Editar horario' : 'Agregar horario'} - {daysOfWeek.find(d => d.value === selectedDay)?.label}
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
                  // Only clear end time if not editing (to avoid clearing during edit)
                  if (!editingSlot) {
                    setEndTime('');
                  }
                  setOverlapError('');
                }}
                label="Hora de inicio"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 225, // Limit height to show ~9 items (9 * 25px per item)
                    },
                  },
                }}
              >
                {getAllTimeSlots().map((time) => (
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
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 225, // Limit height to show ~9 items (9 * 25px per item)
                    },
                  },
                }}
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
            startIcon={editingSlot ? <CheckCircleIcon /> : <AddIcon />}
          >
            {editingSlot ? 'Actualizar Horario' : 'Agregar Horario'}
          </Button>
        </DialogActions>
      </Dialog>

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
