'use client';

import React, { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, Event } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/es';
// Estilos migrados de calendar.css al sistema de MUI
import {
  Box,
  Paper,
  Typography,
  Toolbar,
  IconButton,
  Button,
  ButtonGroup,
  useTheme,
  Chip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add as AddIcon,
} from '@mui/icons-material';
import { useUser } from '@/contexts/UserContext';
import { useStudySessions } from '@/hooks/useStudySessions';
import { StudySession } from '@/types/studySession';
import StudySessionForm from './StudySessionForm';
import StudySessionDetails from './StudySessionDetails';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment as unknown as moment.Moment);

// Tipos para eventos
interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'clase' | 'examen' | 'entrega' | 'personal';
  description?: string;
  session?: StudySession; // Para eventos de sesiones de estudio
}

const Calendar: React.FC = () => {
  const theme = useTheme();
  const { userData } = useUser();
  const {
    sessions,
    loading: sessionsLoading,
  // error: sessionsError, // Eliminado porque no se usa
    createSession,
    updateSession,
    deleteSession,
  // updateSessionStatus // Eliminado porque no se usa
  } = useStudySessions();

  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; slots: Date[]; action: string } | null>(null);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);



  // Estilos personalizados para el calendario
  const calendarStyle = useMemo(() => ({
    height: 600,
    fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
    backgroundColor: theme.palette.background.paper,
    border: 'none',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: theme.shadows[2],
    '& .rbc-calendar': {
      borderRadius: 16,
      backgroundColor: '#ffffff !important',
      border: 'none !important',
    },
    '& .rbc-header': {
      backgroundColor: `${theme.palette.primary.main} !important`,
      color: '#fff !important',
      fontWeight: 600,
      padding: '10px 6px',
      borderBottom: `1px solid ${theme.palette.divider} !important`,
      borderRight: '1px solid rgba(255,255,255,0.1) !important',
      fontSize: '1rem',
    },
    '& .rbc-header:last-child': {
      borderRight: 'none !important',
    },
    '& .rbc-row-bg, & .rbc-day-bg, & .rbc-time-slot, & .rbc-timeslot-group, & .rbc-time-header, & .rbc-time-content, & .rbc-month-row': {
      backgroundColor: '#ffffff !important',
      border: `1px solid ${theme.palette.divider} !important`,
      minHeight: 32,
      transition: 'background 0.2s',
    },
    '& .rbc-time-view': {
      backgroundColor: '#ffffff !important',
    },
    '& .rbc-time-gutter': {
      backgroundColor: '#ffffff !important',
      borderRight: `1px solid ${theme.palette.divider} !important`,
    },
    '& .rbc-day-slot': {
      backgroundColor: '#ffffff !important',
    },
    '& .rbc-current-time-indicator': {
      backgroundColor: theme.palette.error.main,
    },
    '& .rbc-today': {
      backgroundColor: `${theme.palette.action.hover} !important`,
    },
    '& .rbc-off-range-bg': {
      backgroundColor: `${theme.palette.action.disabledBackground} !important`,
    },
    '& .rbc-event': {
      borderRadius: 8,
      border: 'none',
      fontSize: 13,
      fontWeight: 500,
      padding: '4px 8px',
      boxShadow: theme.shadows[1],
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
      margin: '2px 0',
    },
    '& .rbc-selected': {
      backgroundColor: theme.palette.primary.dark,
      color: '#fff',
    },
    '& .rbc-toolbar': {
      marginBottom: '16px',
      background: 'transparent',
    },
    '& .rbc-month-row': {
      minHeight: 80,
    },
    '& .rbc-date-cell': {
      textAlign: 'right',
      padding: '4px 8px',
      fontWeight: 500,
      color: theme.palette.text.secondary,
      fontSize: '0.95rem',
    },
    '& .rbc-label': {
      color: theme.palette.text.secondary,
      fontWeight: 500,
    },
  }), [theme]);

  // Función para obtener el color según el tipo de evento
  const getEventStyle = (event: Event): { style?: CSSProperties } => {
    const calendarEvent = event as CalendarEvent;
    const colors: Record<string, CSSProperties> = {
      clase: { backgroundColor: theme.palette.primary.main, color: 'white' },
      examen: { backgroundColor: '#ef4444', color: 'white' },
      entrega: { backgroundColor: '#f59e0b', color: 'white' },
      personal: { backgroundColor: '#10b981', color: 'white' },
    };

    if (calendarEvent.session) {
      const session = calendarEvent.session;
      if (session.priority === 'high') {
        return { style: { backgroundColor: '#ef4444', color: 'white' } };
      } else if (session.priority === 'low') {
        return { style: { backgroundColor: '#22c55e', color: 'white' } };
      } else {
        return { style: { backgroundColor: '#3b82f6', color: 'white' } };
      }
    }

    return {
      style: colors[calendarEvent.type] || colors.personal
    };
  };
  // Componente personalizado para el toolbar
  interface CustomToolbarProps {
    label: string;
    onNavigate: (action: string) => void;
    onView: (view: View) => void;
  }
  const CustomToolbar = ({ label, onNavigate, onView }: CustomToolbarProps) => (
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
          onClick={() => {
            setEditingSession(null);
            setSelectedSlot(null);
            setFormDialogOpen(true);
          }}
          sx={{ ml: 1 }}
        >
          Nueva Sesión
        </Button>
      </Box>
    </Toolbar>
  );

  // Función para manejar la selección de slots
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots: Date[]; action: string }) => {
    setSelectedSlot(slotInfo);
    setEditingSession(null);
    setFormDialogOpen(true);
  };

  // Función para manejar la selección de eventos
  const handleSelectEvent = (event: Event) => {
    // Si es una sesión de estudio, mostrar detalles
    const calendarEvent = event as CalendarEvent;
    // Si es una sesión de estudio, mostrar detalles
    if (calendarEvent.session) {
      setSelectedSession(calendarEvent.session);
      setDetailsDialogOpen(true);
    }
  };

  // Manejar edición desde detalles hheheheheheh
  const handleEdit = () => {
    if (selectedSession) {
      setEditingSession(selectedSession);
      setDetailsDialogOpen(false);
      setFormDialogOpen(true);
    }
  };

  // Manejar eliminación desde detalles
  const handleDelete = () => {
    setDetailsDialogOpen(false);
    setDeleteConfirmOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (selectedSession) {
      try {
        await deleteSession(selectedSession.id);
        setDeleteConfirmOpen(false);
        setSelectedSession(null);
      } catch (error) {
        console.error('Error al eliminar sesión:', error);
      }
    }
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
  };

  // Cerrar detalles
  const handleDetailsClose = () => {
    setDetailsDialogOpen(false);
    setSelectedSession(null);
  };

  // Solo mostrar sesiones de estudio creadas por el usuario
  const events = useMemo(() => {
    const studySessionEvents: CalendarEvent[] = sessions.map(session => ({
      id: session.id,
      title: session.title,
      start: session.startTime,
      end: session.endTime,
      type: 'personal', // Las sesiones de estudio son tipo personal
      description: session.description,
      session: session // Incluir la sesión completa para acceso posterior
    }));

    return studySessionEvents;
  }, [sessions]);

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
            label="Personal/Estudio" 
            sx={{ 
              backgroundColor: '#10b981', 
              color: 'white',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
            size="small"
          />
        </Box>

        <Box sx={{ ...calendarStyle, height: 600 }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={getEventStyle}
            components={{
              toolbar: CustomToolbar,
            }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
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
              showMore: '+ Ver más',
            }}
          />
        </Box>
      </Paper>

      {/* Formulario para crear/editar sesiones de estudio */}
      <StudySessionForm
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setEditingSession(null);
          setSelectedSlot(null);
        }}
        onSubmit={async (formData) => {
          try {
            let success = false;
            if (editingSession) {
              const result = await updateSession(editingSession.id, formData);
              success = result !== null;
            } else {
              const result = await createSession(formData);
              success = result !== null;
            }
            
            if (success) {
              setFormDialogOpen(false);
              setEditingSession(null);
              setSelectedSlot(null);
            }
            
            return success;
          } catch (error) {
            console.error('Error al guardar sesión:', error);
            return false;
          }
        }}
        editingSession={editingSession}
        selectedSlot={selectedSlot}
      />

      {/* Detalles de sesión de estudio */}
      <StudySessionDetails
        open={detailsDialogOpen}
        onClose={handleDetailsClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
        session={selectedSession}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        session={selectedSession}
        loading={sessionsLoading}
      />
    </Box>
  );
};

export default Calendar;