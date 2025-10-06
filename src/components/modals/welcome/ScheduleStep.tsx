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
  Paper
} from '@mui/material';
import { Schedule, AccessTime, Add, Delete } from '@mui/icons-material';
import { DaySchedule, TimeSlot, daysOfWeek, timeSlots } from './types';

interface ScheduleStepProps {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
  error: boolean;
}

export default function ScheduleStep({ schedule, onChange, error }: ScheduleStepProps) {
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const addTimeSlot = () => {
    if (!selectedDay || !startTime || !endTime) return;
    
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

    // Limpiar formulario
    setStartTime('');
    setEndTime('');
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    
    // Si no quedan horarios, remover el día
    if (updatedSchedule[dayIndex].timeSlots.length === 0) {
      updatedSchedule.splice(dayIndex, 1);
    }
    
    onChange(updatedSchedule);
  };

  const formatTime = (time: string) => {
    return `${time}`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        ¿Entre qué rango de horarios tienes disponibilidad para estudiar?
      </Typography>

      {/* Formulario para agregar horarios */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          Agregar horario de estudio
        </Typography>
        
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Día de la semana</InputLabel>
            <Select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              label="Día de la semana"
            >
              {daysOfWeek.map((day) => (
                <MenuItem key={day.value} value={day.value}>
                  {day.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
            disabled={!selectedDay || !startTime || !endTime}
            sx={{
              alignSelf: 'flex-start',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            }}
          >
            Agregar Horario
          </Button>
        </Stack>
      </Paper>

      {/* Vista del calendario semanal */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime color="primary" />
          Tu horario de estudio semanal
        </Typography>
        
        {schedule.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fafafa' }}>
            <Typography variant="body2" color="text.secondary">
              No has agregado horarios aún. Selecciona los días y horas que tienes disponibles para estudiar.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 2,
            '@media (max-width: 600px)': {
              gridTemplateColumns: '1fr'
            }
          }}>
            {daysOfWeek.map((dayOfWeek) => {
              const daySchedule = schedule.find(d => d.day === dayOfWeek.value);
              return (
                <Box key={dayOfWeek.value}>
                  <Card sx={{ 
                    height: '100%',
                    backgroundColor: daySchedule ? '#e3f2fd' : '#f5f5f5',
                    border: daySchedule ? '2px solid #1976d2' : '1px solid #e0e0e0'
                  }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ 
                        color: daySchedule ? '#1976d2' : '#666',
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        {dayOfWeek.label}
                      </Typography>
                      
                      {daySchedule ? (
                        <Stack spacing={1}>
                          {daySchedule.timeSlots.map((slot, slotIndex) => {
                            const dayIndex = schedule.findIndex(d => d.day === dayOfWeek.value);
                            return (
                              <Chip
                                key={slotIndex}
                                label={`${formatTime(slot.start)} - ${formatTime(slot.end)}`}
                                variant="filled"
                                color="primary"
                                size="small"
                                onDelete={() => removeTimeSlot(dayIndex, slotIndex)}
                                deleteIcon={<Delete />}
                                sx={{ 
                                  fontSize: '0.75rem',
                                  '& .MuiChip-deleteIcon': {
                                    fontSize: '16px'
                                  }
                                }}
                              />
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                          Sin horarios
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          Por favor agrega al menos un horario de estudio
        </Typography>
      )}
    </Box>
  );
}