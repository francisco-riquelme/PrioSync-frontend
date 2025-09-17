'use client';

import React, { useState, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, Event } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import './calendar.css'; // Importar estilos personalizados
import {
  Box,
  Paper,
  Typography,
  Toolbar,
  IconButton,
  Button,
  ButtonGroup,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add as AddIcon,
} from '@mui/icons-material';
import { useUser } from '@/contexts/UserContext';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment);

// Tipos para eventos
interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'clase' | 'examen' | 'entrega' | 'personal';
  description?: string;
}

const Calendar: React.FC = () => {
  const theme = useTheme();
  const { userData } = useUser();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Función para convertir actividades en eventos de calendario
  const generateEventsFromUserData = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    
    // Eventos académicos fijos basados en los cursos del usuario
    if (userData?.courses) {
      userData.courses.forEach(course => {
        // Agregar clases semanales para cada curso
        const startDate = new Date(2025, 8, 16); // 16 Sep 2025 (Lunes)
        for (let week = 0; week < 12; week++) {
          const classDate = new Date(startDate);
          classDate.setDate(startDate.getDate() + (week * 7));
          
          events.push({
            id: `${course.courseId}-clase-${week}`,
            title: `Clase: ${course.courseName}`,
            start: new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate(), 10, 0),
            end: new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate(), 12, 0),
            type: 'clase',
            description: `Clase semanal de ${course.courseName}`
          });
        }

        // Agregar examen final para cada curso
        const examDate = new Date(2025, 10, 15 + Math.floor(Math.random() * 14)); // Nov 2025
        events.push({
          id: `${course.courseId}-examen`,
          title: `Examen: ${course.courseName}`,
          start: new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate(), 14, 0),
          end: new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate(), 16, 0),
          type: 'examen',
          description: `Examen final de ${course.courseName}`
        });

        // Agregar entrega de proyecto
        const projectDate = new Date(2025, 9, 20 + Math.floor(Math.random() * 20)); // Oct 2025
        events.push({
          id: `${course.courseId}-proyecto`,
          title: `Entrega: Proyecto ${course.courseName}`,
          start: new Date(projectDate.getFullYear(), projectDate.getMonth(), projectDate.getDate(), 23, 59),
          end: new Date(projectDate.getFullYear(), projectDate.getMonth(), projectDate.getDate(), 23, 59),
          type: 'entrega',
          description: `Entrega de proyecto final de ${course.courseName}`
        });
      });
    }

    // Eventos adicionales específicos del calendario académico
    const additionalEvents: CalendarEvent[] = [
      {
        id: 'reunion-equipo-1',
        title: 'Reunión Equipo Capstone',
        start: new Date(2025, 8, 18, 15, 0), // 18 Sep 2025, 15:00
        end: new Date(2025, 8, 18, 16, 30),
        type: 'personal',
        description: 'Reunión semanal del equipo de desarrollo'
      },
      {
        id: 'presentacion-avance',
        title: 'Presentación Avance Capstone',
        start: new Date(2025, 9, 5, 9, 0), // 5 Oct 2025, 9:00
        end: new Date(2025, 9, 5, 11, 0),
        type: 'examen',
        description: 'Presentación del avance del proyecto capstone'
      },
      {
        id: 'entrega-documentacion',
        title: 'Entrega Documentación Técnica',
        start: new Date(2025, 9, 15, 23, 59), // 15 Oct 2025, 23:59
        end: new Date(2025, 9, 15, 23, 59),
        type: 'entrega',
        description: 'Entrega de documentación técnica del proyecto'
      }
    ];

    return [...events, ...additionalEvents];
  };

  const events = useMemo(() => generateEventsFromUserData(), [userData]);

  // Estilos personalizados para el calendario
  const calendarStyle = useMemo(() => ({
    height: 600,
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.background.paper,
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    '& .rbc-calendar': {
      borderRadius: theme.shape.borderRadius,
    },
    '& .rbc-header': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      fontWeight: 600,
      padding: '12px 8px',
      borderBottom: 'none',
    },
    '& .rbc-today': {
      backgroundColor: theme.palette.secondary.main,
    },
    '& .rbc-event': {
      borderRadius: '8px',
      border: 'none',
      fontSize: '12px',
      fontWeight: 500,
    },
    '& .rbc-selected': {
      backgroundColor: theme.palette.primary.dark,
    },
    '& .rbc-toolbar': {
      marginBottom: '16px',
    },
  }), [theme]);

  // Función para obtener el color según el tipo de evento
  const getEventStyle = (event: CalendarEvent) => {
    const colors = {
      clase: { backgroundColor: theme.palette.primary.main, color: 'white' },
      examen: { backgroundColor: '#ef4444', color: 'white' },
      entrega: { backgroundColor: '#f59e0b', color: 'white' },
      personal: { backgroundColor: '#10b981', color: 'white' },
    };
    return {
      style: colors[event.type] || colors.personal
    };
  };

  // Componente personalizado para el toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
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
            variant={view === 'month' ? 'contained' : 'outlined'}
          >
            Mes
          </Button>
          <Button 
            onClick={() => onView('week')}
            variant={view === 'week' ? 'contained' : 'outlined'}
          >
            Semana
          </Button>
          <Button 
            onClick={() => onView('day')}
            variant={view === 'day' ? 'contained' : 'outlined'}
          >
            Día
          </Button>
        </ButtonGroup>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ ml: 1 }}
        >
          Nuevo Evento
        </Button>
      </Box>
    </Toolbar>
  );

  // Función para manejar la selección de slots
  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              Mi Calendario Académico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData?.name && `Calendario de ${userData.name.split(' ')[0]}`} • {userData?.courses?.length || 0} cursos activos
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Semestre 2025-2
            </Typography>
          </Box>
        </Box>
        
        {/* Leyenda de tipos de eventos */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip 
            label="Clases" 
            sx={{ 
              backgroundColor: theme.palette.primary.main, 
              color: 'white',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
            size="small"
          />
          <Chip 
            label="Exámenes" 
            sx={{ 
              backgroundColor: '#ef4444', 
              color: 'white',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
            size="small"
          />
          <Chip 
            label="Entregas" 
            sx={{ 
              backgroundColor: '#f59e0b', 
              color: 'white',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
            size="small"
          />
          <Chip 
            label="Personal" 
            sx={{ 
              backgroundColor: '#10b981', 
              color: 'white',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
            size="small"
          />
        </Box>

        <Box sx={{ ...calendarStyle }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={getEventStyle}
            components={{
              toolbar: CustomToolbar,
            }}
            onSelectSlot={handleSelectSlot}
            selectable
            messages={{
              next: 'Siguiente',
              previous: 'Anterior',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay eventos en este rango',
              showMore: (total: number) => `+ Ver más (${total})`,
            }}
          />
        </Box>
      </Paper>

      {/* Dialog para crear nuevo evento */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo Evento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Funcionalidad de creación de eventos - Se integrará con la API
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Título del evento"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Crear Evento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;