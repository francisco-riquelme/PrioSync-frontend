'use client';

import React, { useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Schedule } from '@mui/icons-material';

interface QuizTimerProps {
  timeLeft: number;
  totalTime: number;
  onTimeUp: () => void;
  isActive: boolean;
  onTick: (newTime: number) => void;
}

const QuizTimer: React.FC<QuizTimerProps> = ({
  timeLeft,
  totalTime,
  onTimeUp,
  isActive,
  onTick
}) => {
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      const newTime = timeLeft - 1;
      onTick(newTime);
      
      if (newTime <= 0) {
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isActive, onTimeUp, onTick]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalTime * 60 - timeLeft) / (totalTime * 60)) * 100;
  const isLowTime = timeLeft <= 60; // Último minuto

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Schedule sx={{ color: isLowTime ? 'error.main' : 'text.secondary' }} />
        <Typography 
          variant="h6" 
          sx={{ 
            color: isLowTime ? 'error.main' : 'text.primary',
            fontWeight: isLowTime ? 'bold' : 'normal'
          }}
        >
          {formatTime(timeLeft)}
        </Typography>
        {isLowTime && (
          <Typography variant="body2" color="error.main" sx={{ ml: 1 }}>
            ¡Tiempo limitado!
          </Typography>
        )}
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            backgroundColor: isLowTime ? 'error.main' : 'primary.main',
            borderRadius: 4,
          }
        }}
      />
      
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
      >
        Tiempo restante: {Math.ceil(timeLeft / 60)} minutos
      </Typography>
    </Box>
  );
};

export default QuizTimer;