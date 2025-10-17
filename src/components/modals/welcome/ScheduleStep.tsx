import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Add, Delete, Schedule, AccessTime } from '@mui/icons-material';
import { DaySchedule, TimeSlot, daysOfWeek, timeSlots } from './types';

interface ScheduleStepProps {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
  error: boolean;
}

export default function ScheduleStep({ schedule, onChange, error }: ScheduleStepProps) {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [overlapError, setOverlapError] = useState<string>('');

  // Función para detectar si dos rangos de tiempo se superponen
  const hasOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
    return (
      (slot1.start >= slot2.start && slot1.start < slot2.end) || // inicio1 dentro de slot2
      (slot1.end > slot2.start && slot1.end <= slot2.end) ||     // fin1 dentro de slot2
      (slot1.start <= slot2.start && slot1.end >= slot2.end)     // slot1 contiene slot2
    );
  };

  // Función para obtener todas las horas bloqueadas de un día específico
  const getBlockedTimes = (dayValue: string, forStartTime: boolean = true): Set<string> => {
    const daySchedule = getDaySchedule(dayValue);
    const blocked = new Set<string>();
    
    if (!daySchedule) return blocked;
    
    daySchedule.timeSlots.forEach(slot => {
      // Bloquear todas las horas entre inicio y fin (excluyendo el fin para permitir horarios contiguos)
      const startIndex = timeSlots.indexOf(slot.start);
      const endIndex = timeSlots.indexOf(slot.end);
      
      if (forStartTime) {
        // Para hora de inicio: bloquear desde start hasta end (sin incluir end)
        for (let i = startIndex; i < endIndex; i++) {
          blocked.add(timeSlots[i]);
        }
      } else {
        // Para hora de fin: bloquear desde start+1 hasta end (incluir end)
        for (let i = startIndex + 1; i <= endIndex; i++) {
          if (i < timeSlots.length) {
            blocked.add(timeSlots[i]);
          }
        }
      }
    });
    
    return blocked;
  };

  // Función para obtener horas de fin válidas basadas en la hora de inicio seleccionada
  const getValidEndTimes = (): string[] => {
    if (!startTime || !selectedDay) return timeSlots;
    
    const startIndex = timeSlots.indexOf(startTime);
    
    // Filtrar horas de fin que sean:
    // 1. Posteriores a la hora de inicio
    // 2. No bloqueadas por otros horarios
    return timeSlots.filter((time, index) => {
      if (index <= startIndex) return false; // Debe ser posterior al inicio
      
      // Verificar si hay algún horario bloqueado entre startTime y este time
      const daySchedule = getDaySchedule(selectedDay);
      if (daySchedule) {
        for (const existingSlot of daySchedule.timeSlots) {
          // Si hay un slot existente que empieza después de startTime y antes o igual a time
          if (existingSlot.start >= startTime && existingSlot.start < time) {
            return false; // No permitir este time porque atravesaría un slot existente
          }
        }
      }
      
      return true;
    });
  };

  // (antes) Contador de franjas horarias — eliminado porque no se usa

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    setStartTime('');
    setEndTime('');
    setOverlapError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDay('');
    setStartTime('');
    setEndTime('');
    setOverlapError('');
  };

  const addTimeSlot = () => {
    if (!selectedDay || !startTime || !endTime) return;
    
    // Validación: hora de inicio debe ser anterior a hora de fin
    if (startTime >= endTime) {
      setOverlapError('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    // Validación: verificar superposición con horarios existentes
    const newTimeSlot: TimeSlot = { start: startTime, end: endTime };
    const existingDaySchedule = getDaySchedule(selectedDay);

    if (existingDaySchedule) {
      const hasConflict = existingDaySchedule.timeSlots.some(
        existingSlot => hasOverlap(newTimeSlot, existingSlot)
      );
      
      if (hasConflict) {
        setOverlapError('Este horario se superpone con uno existente. Por favor, selecciona otro rango de horas.');
        return;
      }
    }

    // Limpiar error si todo está bien
    setOverlapError('');

    const existingDayIndex = schedule.findIndex(d => d.day === selectedDay);

    if (existingDayIndex >= 0) {
      // Agregar al día existente
      const updatedSchedule = [...schedule];
      updatedSchedule[existingDayIndex].timeSlots.push(newTimeSlot);
      onChange(updatedSchedule);
    } else {
      // Crear nuevo día
      const newDaySchedule: DaySchedule = {
        day: selectedDay,
        timeSlots: [newTimeSlot]
      };
      onChange([...schedule, newDaySchedule]);
    }

    // Limpiar selección de horas y cerrar modal automáticamente
    setStartTime('');
    setEndTime('');
    handleCloseModal();
  };

  const removeTimeSlot = (dayValue: string, slotIndex: number) => {
    const dayIndex = schedule.findIndex(d => d.day === dayValue);
    if (dayIndex < 0) return;

    const updatedSchedule = [...schedule];
    updatedSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    
    // Si no quedan horarios, remover el día
    if (updatedSchedule[dayIndex].timeSlots.length === 0) {
      updatedSchedule.splice(dayIndex, 1);
    }
    
    onChange(updatedSchedule);
  };

  const getDaySchedule = (dayValue: string): DaySchedule | undefined => {
    return schedule.find(d => d.day === dayValue);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 1 }}>
        ¿Entre qué rango de horarios tienes disponibilidad para estudiar?
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
        <Box 
          component="span" 
          sx={{ 
            width: 24, 
            height: 24, 
            borderRadius: '50%', 
            bgcolor: '#1976d2', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}
        >
          ℹ
        </Box>
        <Typography variant="body2" color="text.secondary">
          Tu horario de estudio semanal
        </Typography>
      </Box>

      {/* Tarjetas de días clicables */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 2,
        mb: 3,
        '@media (max-width: 600px)': {
          gridTemplateColumns: 'repeat(2, 1fr)'
        }
      }}>
        {daysOfWeek.map((dayOfWeek) => {
          const daySchedule = getDaySchedule(dayOfWeek.value);
          const hasSchedule = !!daySchedule && daySchedule.timeSlots.length > 0;
          const isSelected = selectedDay === dayOfWeek.value;
          
          return (
            <Card 
              key={dayOfWeek.value}
              onClick={() => handleDayClick(dayOfWeek.value)}
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isSelected 
                  ? '#1976d2' 
                  : hasSchedule 
                    ? '#e3f2fd' 
                    : '#f5f5f5',
                border: isSelected
                  ? '2px solid #1565c0'
                  : hasSchedule 
                    ? '2px solid #1976d2' 
                    : '1px solid #e0e0e0',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  backgroundColor: isSelected
                    ? '#1565c0'
                    : hasSchedule
                      ? '#bbdefb'
                      : '#eeeeee'
                }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: isSelected ? 'white' : hasSchedule ? '#1976d2' : '#666',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    mb: 1,
                    fontSize: '0.95rem'
                  }}
                >
                  {dayOfWeek.label}
                </Typography>
                
                {hasSchedule ? (
                  <Stack spacing={0.5}>
                    {daySchedule!.timeSlots.map((slot, slotIndex) => (
                      <Chip
                        key={slotIndex}
                        label={`${slot.start} - ${slot.end}`}
                        variant="filled"
                        color={isSelected ? "default" : "primary"}
                        size="small"
                        onDelete={(e) => {
                          e.stopPropagation();
                          removeTimeSlot(dayOfWeek.value, slotIndex);
                        }}
                        deleteIcon={<Delete />}
                        sx={{ 
                          fontSize: '0.7rem',
                          height: '24px',
                          backgroundColor: isSelected ? 'white' : undefined,
                          color: isSelected ? '#1976d2' : undefined,
                          '& .MuiChip-deleteIcon': {
                            fontSize: '14px',
                            color: isSelected ? '#1976d2' : 'white'
                          }
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      textAlign: 'center', 
                      fontStyle: 'italic',
                      display: 'block',
                      color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                    }}
                  >
                    Sin horarios
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Mensaje de error */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Por favor agrega al menos un horario de estudio
        </Alert>
      )}

      {/* Modal para seleccionar horas */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          Agregar horario - {daysOfWeek.find(d => d.value === selectedDay)?.label}
        </DialogTitle>
        
        <DialogContent>
          {/* Alert de error de superposición */}
          {overlapError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {overlapError}
            </Alert>
          )}

          {/* Mostrar horarios ya agregados para este día */}
          {getDaySchedule(selectedDay) && getDaySchedule(selectedDay)!.timeSlots.length > 0 && (
            <Box sx={{ mb: 3, mt: overlapError ? 1 : 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime fontSize="small" />
                Horarios agregados:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {getDaySchedule(selectedDay)!.timeSlots.map((slot, index) => (
                  <Chip
                    key={index}
                    label={`${slot.start} - ${slot.end}`}
                    onDelete={() => removeTimeSlot(selectedDay, index)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Hora inicio</InputLabel>
                <Select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setEndTime(''); // Resetear hora fin al cambiar hora inicio
                    setOverlapError(''); // Limpiar error
                  }}
                  label="Hora inicio"
                >
                  {timeSlots.map((time) => {
                    const blockedStartTimes = getBlockedTimes(selectedDay, true);
                    const isBlocked = blockedStartTimes.has(time);
                    
                    return (
                      <MenuItem 
                        key={time} 
                        value={time}
                        disabled={isBlocked}
                      >
                        {time} {isBlocked ? '(ocupado)' : ''}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Hora fin</InputLabel>
                <Select
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setOverlapError(''); // Limpiar error
                  }}
                  label="Hora fin"
                  disabled={!startTime}
                >
                  {getValidEndTimes().map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addTimeSlot}
              disabled={!startTime || !endTime}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              }}
            >
              Agregar Horario
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}