'use client';

import React, { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, Event } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/es';
import {
  Box,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { useUser } from '@/contexts/UserContext';
import { useStudySessions } from '@/hooks/useStudySessions';
import { StudySession } from '@/types/studySession';
import { CalendarEvent } from './componentTypes';
import CalendarToolbar from './CalendarToolbar';
import StudySessionForm from './StudySessionForm';
import StudySessionDetails from './StudySessionDetails';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment as unknown as moment.Moment);

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

  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    setView(newView as View);
  };
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
      backgroundColor: '#e8f5e9 !important', // Verde claro minimalista
      border: '1px solid #81c784 !important',
    },
    '& .rbc-off-range-bg': {
      backgroundColor: `${theme.palette.action.disabledBackground} !important`,
    },
    // Estilos para fechas pasadas (deshabilitadas)
    '& .rbc-day-bg.past-date': {
      backgroundColor: `${theme.palette.action.disabledBackground} !important`,
      cursor: 'not-allowed !important',
      opacity: 0.6,
    },
    '& .rbc-date-cell.past-date': {
      color: `${theme.palette.text.disabled} !important`,
      cursor: 'not-allowed !important',
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

  // Función para obtener el color de los eventos (simplificado - un solo estilo)
  const getEventStyle = (): { style: CSSProperties } => {
    return {
      style: {
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        borderRadius: 8,
        border: 'none',
        fontSize: 13,
        fontWeight: 500,
        padding: '4px 8px',
        boxShadow: theme.shadows[1],
      }
    };
  };

  // Función para manejar la selección de slots
  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots: Date[]; action: string }) => {
    // Verificar que no sea una fecha pasada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(slotInfo.start);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      // No permitir selección de fechas pasadas
      return;
    }
    
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
              toolbar: (props: { label: string; onNavigate: (action: string) => void; onView: (view: View) => void }) => (
                <CalendarToolbar
                  label={props.label}
                  onNavigate={props.onNavigate}
                  onView={handleViewChange}
                  currentView={view as 'month' | 'week' | 'day'}
                  onAddSession={() => {
                    setEditingSession(null);
                    setSelectedSlot(null);
                    setFormDialogOpen(true);
                  }}
                />
              ),
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
            // Generar título automático basado en fecha y hora
            const date = new Date(formData.startDate);
            const dateStr = date.toLocaleDateString('es-ES', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            });
            const autoTitle = `Sesión de Estudio - ${dateStr} ${formData.startTime}`;
            
            // Adaptar los datos del formulario simplificado al formato del hook
            const adaptedFormData = {
              title: autoTitle,
              subject: 'Estudio Personal', // Campo fijo para el formato simplificado
              startDate: formData.startDate,
              startTime: formData.startTime,
              endDate: formData.startDate, // Usar la misma fecha
              endTime: formData.endTime,
              description: '', // Campo opcional vacío
              priority: 'medium' as const, // Prioridad fija
              location: '', // Ubicación vacía
              tags: [], // Tags vacíos
              reminder: 15 // Recordatorio por defecto
            };

            let success = false;
            if (editingSession) {
              const result = await updateSession(editingSession.id, adaptedFormData);
              success = result !== null;
            } else {
              const result = await createSession(adaptedFormData);
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