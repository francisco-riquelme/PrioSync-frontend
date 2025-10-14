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
  Stack
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { DaySchedule, TimeSlot, daysOfWeek, timeSlots } from './types';

interface ScheduleStepProps {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
  error: boolean;
}

const MAX_SIGNUP_TIMESLOTS = 5;

export default function ScheduleStep({ schedule, onChange, error }: ScheduleStepProps) {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Count total time slots across all days
  const totalTimeSlots = schedule.reduce((total, day) => total + day.timeSlots.length, 0);
  const canAddMoreSlots = totalTimeSlots < MAX_SIGNUP_TIMESLOTS;

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    setStartTime('');
    setEndTime('');
  };

  const addTimeSlot = () => {
    if (!selectedDay || !startTime || !endTime) return;
    
    if (!canAddMoreSlots) {
      alert('Por el momento solo puedes agregar hasta 5 bloques de estudio. Podrás crear más bloques después del registro.');
      return;
    }
    
    if (startTime >= endTime) {
      alert('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    const newTimeSlot: TimeSlot = { start: startTime, end: endTime };
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

    // Limpiar selección de horas
    setStartTime('');
    setEndTime('');
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

      {/* Selector de horas - Solo visible cuando hay un día seleccionado */}
      {selectedDay && (
        <Box sx={{ 
          p: 3, 
          mb: 2, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 2,
          border: '2px solid #1976d2'
        }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
            Agregar horario de estudio para {daysOfWeek.find(d => d.value === selectedDay)?.label}
          </Typography>
          
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Hora inicio</InputLabel>
                <Select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  label="Hora inicio"
                >
                  {timeSlots.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Hora fin</InputLabel>
                <Select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  label="Hora fin"
                >
                  {timeSlots.map((time) => (
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
              sx={{
                alignSelf: 'flex-start',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              }}
            >
              Agregar Horario
            </Button>
          </Stack>
        </Box>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          Por favor agrega al menos un horario de estudio
        </Typography>
      )}
    </Box>
  );
}