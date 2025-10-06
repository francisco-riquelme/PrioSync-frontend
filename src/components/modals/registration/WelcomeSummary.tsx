import React from 'react';
import { Box, Typography } from '@mui/material';
import { WelcomeFormData, DaySchedule } from '../welcome/types';

interface WelcomeSummaryProps {
  welcomeData: WelcomeFormData;
}

const formatSchedule = (schedule: DaySchedule[]): string => {
  if (schedule.length === 0) return 'Sin horarios definidos';
  
  return schedule
    .filter(day => day.timeSlots.length > 0)
    .map(day => {
      const slots = day.timeSlots.map(slot => `${slot.start}-${slot.end}`).join(', ');
      return `${day.day}: ${slots}`;
    })
    .join('; ');
};

export default function WelcomeSummary({ welcomeData }: WelcomeSummaryProps) {
  return (
    <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        Resumen de tu perfil:
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        📚 Estudiar: {welcomeData.estudio}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        ⏰ Tiempo: {formatSchedule(welcomeData.tiempoDisponible)}
      </Typography>
      <Typography variant="body2">
        🎥 YouTube: {welcomeData.youtubeUrl}
      </Typography>
    </Box>
  );
}