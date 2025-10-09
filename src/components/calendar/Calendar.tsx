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
import { useStudySessions } from '@/components/courses/hooks/useStudySessions';
import type { MainTypes } from '@/utils/api/schema';
import { StudySession } from '@/types/studySession';
import { CalendarEvent } from './componentTypes';
import CalendarToolbar from './CalendarToolbar';
import StudySessionForm from './StudySessionForm';
import StudySessionDetails from './StudySessionDetails';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

// Type for SesionEstudio from schema
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

// Helper function to convert SesionEstudio to StudySession
const convertToStudySession = (sesion: SesionEstudio): StudySession => {
  const startTime = new Date(`${sesion.fecha}T${sesion.hora_inicio}`);
  const endTime = new Date(`${sesion.fecha}T${sesion.hora_fin}`);
  
  return {
    id: sesion.sesionEstudioId || '',
    title: `Sesión de ${sesion.tipo || 'estudio'}`,
    subject: sesion.cursoId || 'Estudio Personal',
    startTime,
    endTime,
    description: '',
    location: '',
    priority: 'medium',
    status: sesion.estado === 'programada' ? 'planned' : 
            sesion.estado === 'completada' ? 'completed' : 
            sesion.estado === 'cancelada' ? 'cancelled' : 'planned',
    reminder: sesion.recordatorios ? parseInt(sesion.recordatorios) : 15,
    tags: [],
    createdAt: sesion.createdAt ? new Date(sesion.createdAt) : new Date(),
    updatedAt: sesion.updatedAt ? new Date(sesion.updatedAt) : new Date(),
  };
};

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment as unknown as moment.Moment);

const Calendar: React.FC = () => {
  const theme = useTheme();
  const { userData } = useUser();
  const {
    sessions: rawSessions,
    loading: sessionsLoading,
    createSession,
    updateSession,
    deleteSession,
  } = useStudySessions({ usuarioId: userData?.usuarioId });

  // Convert backend sessions to frontend format
  const sessions = useMemo(() => 
    rawSessions.map(convertToStudySession), 
    [rawSessions]
  );

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
              {userData?.nombre && `Calendario de ${userData.nombre.split(' ')[0]}`} • {userData?.InscripcionesCurso?.length || 0} cursos activos
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
            if (!userData?.usuarioId) {
              console.error('Usuario no autenticado');
              return false;
            }

            // Calculate duration in minutes
            const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
            const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);
            const duracion_minutos = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

            let success = false;
            
            if (editingSession) {
              // UPDATE: Pass single object with id
              const result = await updateSession({
                sesionEstudioId: editingSession.id,
                fecha: formData.startDate,
                hora_inicio: formData.startTime,
                hora_fin: formData.endTime,
                duracion_minutos,
                tipo: 'estudio' as const,
                estado: 'programada' as const,
              });
              success = result !== null;
            } else {
              // CREATE: Pass complete data
              const result = await createSession({
                sesionEstudioId: crypto.randomUUID(),
                usuarioId: userData.usuarioId,
                fecha: formData.startDate,
                hora_inicio: formData.startTime,
                hora_fin: formData.endTime,
                duracion_minutos,
                tipo: 'estudio' as const,
                estado: 'programada' as const,
                cursoId: undefined,
                google_event_id: undefined,
                recordatorios: undefined,
              });
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