'use client';

import React from 'react';
import {
  Toolbar,
  Typography,
  IconButton,
  Button,
  ButtonGroup,
  Box,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add as AddIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { CalendarToolbarProps } from './componentTypes';

const CalendarToolbar: React.FC<CalendarToolbarProps & { onAddSession: () => void; onStudyHours?: () => void }> = ({
  label,
  onNavigate,
  onView,
  currentView,
  onAddSession,
  onStudyHours,
}) => {
  return (
    <Toolbar sx={{ justifyContent: 'space-between', mb: 2, px: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => onNavigate('PREV')} size="small">
          <ChevronLeft />
        </IconButton>
        <IconButton onClick={() => onNavigate('TODAY')} size="small">
          <Today />
        </IconButton>
        <IconButton onClick={() => onNavigate('NEXT')} size="small">
          <ChevronRight />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
          {label}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <ButtonGroup size="small" variant="outlined">
          <Button 
            onClick={() => onView('month')}
            variant={currentView === 'month' ? 'contained' : 'outlined'}
          >
            Mes
          </Button>
          <Button 
            onClick={() => onView('week')}
            variant={currentView === 'week' ? 'contained' : 'outlined'}
          >
            Semana
          </Button>
          <Button 
            onClick={() => onView('day')}
            variant={currentView === 'day' ? 'contained' : 'outlined'}
          >
            Día
          </Button>
        </ButtonGroup>
        
        <Button
          variant="outlined"
          startIcon={<ScheduleIcon />}
          onClick={onStudyHours}
          sx={{ 
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Mis Horas de Estudio
        </Button>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddSession}
        >
          Nueva Sesión
        </Button>
      </Box>
    </Toolbar>
  );
};

export default CalendarToolbar;