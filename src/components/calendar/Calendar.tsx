'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View, Event, NavigateAction } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/es';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import { useUser } from '@/contexts/UserContext';
import { useCalendarData } from '@/hooks/useCalendarData';
import type { MainTypes } from '@/utils/api/schema';
import { StudySession } from '@/types/studySession';
import { CalendarEvent } from './componentTypes';
import CalendarToolbar from './CalendarToolbar';
import StudySessionForm from './StudySessionForm';
import StudySessionDetails from './StudySessionDetails';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { getDayName } from '@/utils/scheduleHelpers';

// Type for SesionEstudio from schema
type SesionEstudio = MainTypes["SesionEstudio"]["type"];

// Helper function to convert SesionEstudio to StudySession
const convertToStudySession = (sesion: SesionEstudio): StudySession => {
  const startTime = new Date(`${sesion.fecha}T${sesion.hora_inicio}`);
  const endTime = new Date(`${sesion.fecha}T${sesion.hora_fin}`);
  
  // Create contextual title based on associations
  let title = 'Sesión de estudio';
  if (sesion.leccionId) {
    title = '📖 Lección';
  } else if (sesion.cursoId) {
    title = '📚 Curso';
  }
  
  return {
    id: sesion.sesionEstudioId || '',
    title,
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
    cursoId: sesion.cursoId || undefined, // NEW
    leccionId: sesion.leccionId || undefined, // NEW
  };
};

// Configurar moment en español
moment.locale('es');
const localizer = momentLocalizer(moment as unknown as moment.Moment);

// Predefined color palette for courses (good contrast colors)
const COURSE_COLORS = [
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#c2185b', // Pink
  '#00796b', // Teal
  '#d32f2f', // Red
  '#5d4037', // Brown
  '#0288d1', // Light Blue
  '#689f38', // Light Green
  '#e64a19', // Deep Orange
  '#512da8', // Deep Purple
  '#c2185b', // Pink
  '#0097a7', // Cyan
  '#455a64', // Blue Grey
  '#fbc02d', // Yellow
];

// Hash function to convert string to number
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Generate consistent color from courseId
const getColorForCourseId = (courseId: string | undefined): string => {
  if (!courseId) {
    return '#757575'; // Default gray for sessions without course
  }
  const hash = hashString(courseId);
  return COURSE_COLORS[hash % COURSE_COLORS.length];
};

const Calendar: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { userData } = useUser();
  const {
    sessions: rawSessions,
    studyBlockPreferences: preferences,
    loading: sessionsLoading,
    createSession,
    updateSession,
    deleteSession,
  } = useCalendarData(userData?.usuarioId);

  // Convert backend sessions to frontend format
  const sessions = useMemo(() => 
    rawSessions.map(convertToStudySession), 
    [rawSessions]
  );

  // Optimistic updates state
  const [optimisticSessions, setOptimisticSessions] = useState<StudySession[]>([]);
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);

  // Use optimistic sessions when available, otherwise use real sessions
  const displaySessions = isOptimisticUpdate ? optimisticSessions : sessions;

  // Update optimistic sessions when real sessions change
  useEffect(() => {
    if (!isOptimisticUpdate) {
      setOptimisticSessions(sessions);
    } else {
      // If we're in optimistic mode, check if the real data has caught up
      // This happens when the backend operation completes and data is refetched
      const hasNewData = sessions.length !== optimisticSessions.length || 
        sessions.some(session => !optimisticSessions.find(opt => opt.id === session.id));
      
      if (hasNewData) {
        // Real data has been updated, clear optimistic mode
        setIsOptimisticUpdate(false);
        setOptimisticSessions(sessions);
      }
    }
  }, [sessions, isOptimisticUpdate, optimisticSessions]);

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



  // dayPropGetter for past dates and study block highlighting
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(date);
    cellDate.setHours(0, 0, 0, 0);
    
    const isPast = cellDate < today;
    const dayName = getDayName(date);
    const hasStudyBlock = preferences.some(p => p.day === dayName);
    const shouldHighlight = !isPast && hasStudyBlock;
    
    return {
      className: isPast ? 'past-date' : (shouldHighlight ? 'study-block-day' : ''),
      style: {}
    };
  }, [preferences]);

  // Estilos personalizados para el calendario
  const calendarStyle = useMemo(() => ({
    maxHeight: 'calc(100vh - 300px)',
    minHeight: 500,
    fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
    backgroundColor: theme.palette.background.paper,
    border: 'none',
    borderRadius: 4,
    overflowY: 'auto',
    overflowX: 'hidden',
    // Custom scrollbar styling
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.palette.background.default,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.action.disabled,
      borderRadius: '4px',
      '&:hover': {
        background: theme.palette.action.disabledBackground,
      },
    },
    '& .rbc-calendar': {
      backgroundColor: theme.palette.background.paper,
      border: 'none',
      height: 'auto',
      minHeight: '100%',
    },
    '& .rbc-header': {
      backgroundColor: `${theme.palette.primary.main}`,
      color: `${theme.palette.primary.contrastText}`,
      fontWeight: 600,
      padding: '12px 8px',
      border: 'none',
      borderBottom: `2px solid ${theme.palette.primary.dark}`,
    },
    '& .rbc-header + .rbc-header': {
      borderLeft: `1px solid ${theme.palette.primary.dark}`,
    },
    '& .rbc-month-view': {
      border: 'none',
      borderRadius: '0 0 4px 4px',
      overflow: 'visible',
    },
    '& .rbc-month-row': {
      border: 'none',
      borderTop: `1px solid ${theme.palette.divider}`,
      minHeight: 150,
      overflow: 'visible',
    },
    '& .rbc-month-row:first-of-type': {
      borderTop: 'none',
    },
    '& .rbc-day-bg': {
      backgroundColor: theme.palette.background.paper,
      border: 'none',
      borderRight: `1px solid ${theme.palette.divider}`,
      minHeight: 32,
      transition: 'background 0.2s',
    },
    '& .rbc-day-bg + .rbc-day-bg': {
      borderLeft: 'none',
    },
    '& .rbc-off-range-bg': {
      backgroundColor: `${theme.palette.action.disabledBackground}`,
    },
    '& .rbc-today': {
      backgroundColor: theme.palette.secondary.light + '20',
      border: 'none',
      borderRight: `1px solid ${theme.palette.divider}`,
    },
    // Estilos para fechas pasadas (deshabilitadas)
    '& .rbc-day-bg.past-date': {
      backgroundColor: `${theme.palette.action.disabledBackground}`,
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    '& .rbc-date-cell.past-date': {
      color: `${theme.palette.text.disabled}`,
      cursor: 'not-allowed',
    },
    // Estilos para días con bloques de estudio
    '& .rbc-day-bg.study-block-day': {
      backgroundColor: `${theme.palette.secondary.light}15`,
      borderLeft: `3px solid ${theme.palette.secondary.main}`,
      borderRight: `1px solid ${theme.palette.divider}`,
    },
    '& .rbc-date-cell': {
      textAlign: 'right',
      padding: '8px',
      fontWeight: 500,
      color: theme.palette.text.secondary,
      fontSize: '0.95rem',
    },
    '& .rbc-event': {
      borderRadius: 4,
      border: 'none',
      fontSize: 11,
      fontWeight: 500,
      padding: '2px 6px',
      boxShadow: 'none',
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      margin: '1px 2px',
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .rbc-selected': {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
    },
    '& .rbc-toolbar': {
      marginBottom: '16px',
      background: 'transparent',
    },
    '& .rbc-time-view': {
      backgroundColor: `${theme.palette.background.paper}`,
      border: 'none',
    },
    '& .rbc-time-header': {
      border: 'none',
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& .rbc-time-content': {
      border: 'none',
      borderTop: `1px solid ${theme.palette.divider}`,
    },
    '& .rbc-time-slot': {
      borderTop: `1px solid ${theme.palette.divider}`,
    },
    '& .rbc-timeslot-group': {
      borderLeft: `1px solid ${theme.palette.divider}`,
      minHeight: 40,
    },
    '& .rbc-time-gutter': {
      backgroundColor: `${theme.palette.background.paper}`,
      borderRight: `1px solid ${theme.palette.divider}`,
    },
    '& .rbc-day-slot': {
      backgroundColor: `${theme.palette.background.paper}`,
    },
    '& .rbc-current-time-indicator': {
      backgroundColor: theme.palette.error.main,
      height: 2,
    },
    '& .rbc-label': {
      color: theme.palette.text.secondary,
      fontWeight: 500,
      fontSize: '0.875rem',
      padding: '4px 8px',
    },
    '& .rbc-row': {
      display: 'flex',
    },
    '& .rbc-row-segment': {
      padding: '1px 2px',
      height: 'auto',
    },
    '& .rbc-event-content': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  }), [theme]);


  // Función para obtener el color de los eventos basado en cursoId
  const getEventStyle = (event: Event): { style: CSSProperties } => {
    const calendarEvent = event as CalendarEvent;
    const cursoId = calendarEvent.session?.cursoId;
    const backgroundColor = getColorForCourseId(cursoId);
    
    // Determine text color based on background brightness
    const getContrastColor = (bgColor: string): string => {
      // Convert hex to RGB
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      // Calculate brightness
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#ffffff';
    };
    
    return {
      style: {
        backgroundColor,
        color: getContrastColor(backgroundColor),
        borderRadius: 4,
        border: 'none',
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 6px',
        boxShadow: theme.shadows[1],
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
      // Optimistic update: Remove from UI immediately
      setOptimisticSessions(prev => prev.filter(s => s.id !== selectedSession.id));
      setIsOptimisticUpdate(true);

      try {
        await deleteSession(selectedSession.id);
        // Success: Keep optimistic update until real data arrives
        // Don't clear isOptimisticUpdate - let it persist until next fetch
        setDeleteConfirmOpen(false);
        setSelectedSession(null);
      } catch (error) {
        // Error: Revert optimistic update
        setOptimisticSessions(prev => [...prev, selectedSession]);
        setIsOptimisticUpdate(false);
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

  // Create memoized color mapping for courses
  const courseColorMap = useMemo(() => {
    const map = new Map<string, { color: string; name: string }>();
    
    // Get unique course IDs from sessions
    const uniqueCourseIds = new Set<string>();
    displaySessions.forEach(session => {
      if (session.cursoId) {
        uniqueCourseIds.add(session.cursoId);
      }
    });
    
    // Create mapping with colors and course names
    uniqueCourseIds.forEach(courseId => {
      const course = userData?.Cursos?.find(c => c.cursoId === courseId);
      map.set(courseId, {
        color: getColorForCourseId(courseId),
        name: course?.titulo || 'Curso desconocido'
      });
    });
    
    return map;
  }, [displaySessions, userData?.Cursos]);

  // Solo mostrar sesiones de estudio creadas por el usuario
  const events = useMemo(() => {
    const studySessionEvents: CalendarEvent[] = displaySessions.map(session => ({
      id: session.id,
      title: session.title,
      start: session.startTime,
      end: session.endTime,
      type: 'personal', // Las sesiones de estudio son tipo personal
      description: session.description,
      session: session // Incluir la sesión completa para acceso posterior
    }));

    return studySessionEvents;
  }, [displaySessions]);

  // Filter events for the selected day and sort by time
  const dayViewEvents = useMemo(() => {
    if (view !== 'day') return [];
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.start);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === selectedDate.getTime();
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, view, date]);

  // Create a memoized map of lesson IDs to lesson names for quick lookup
  const lessonNameMap = useMemo(() => {
    const map = new Map<string, string>();
    
    if (!userData?.Cursos) return map;
    
    for (const curso of userData.Cursos) {
      if (curso.Modulos) {
        for (const modulo of curso.Modulos) {
          if (modulo.Lecciones) {
            for (const leccion of modulo.Lecciones) {
              if (leccion.leccionId && leccion.titulo) {
                map.set(leccion.leccionId, leccion.titulo);
              }
            }
          }
        }
      }
    }
    
    // Debug: Log if we have lessons but map is empty (data structure might be different)
    if (userData.Cursos.length > 0 && map.size === 0) {
      console.log('No lessons found in userData.Cursos. First curso structure:', userData.Cursos[0]);
    }
    
    return map;
  }, [userData?.Cursos]);

  // Helper function to find lesson name by leccionId
  const getLessonName = useCallback((leccionId: string | undefined): string | null => {
    if (!leccionId) return null;
    return lessonNameMap.get(leccionId) || null;
  }, [lessonNameMap]);

  // Format time for display
  const formatTime = (date: Date) => {
    return moment(date).format('HH:mm');
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return moment(date).format('dddd, D [de] MMMM [de] YYYY');
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              Mi Calendario Académico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData?.nombre && `Calendario de ${userData.nombre.split(' ')[0]}`} • {userData?.Cursos?.filter(curso => curso.estado === 'activo').length || 0} cursos activos
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Semestre 2025-2
            </Typography>
          </Box>
        </Box>

        {/* Leyenda de colores */}
        {(preferences.length > 0 || courseColorMap.size > 0) && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 2, 
              mb: 2, 
              p: 2, 
              bgcolor: 'background.default', 
              borderRadius: 2,
              alignItems: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Leyenda:
            </Typography>
            
            {/* Course colors legend */}
            {courseColorMap.size > 0 && (
              <>
                {Array.from(courseColorMap.entries()).map(([courseId, { color, name }]) => (
                  <Box key={courseId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: color, 
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 0.5 
                      }} 
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
            
            {/* Default color for sessions without course */}
            {displaySessions.some(s => !s.cursoId) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box 
                  sx={{ 
                    width: 16, 
                    height: 16, 
                    bgcolor: getColorForCourseId(undefined), 
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 0.5 
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  Sesión general
                </Typography>
              </Box>
            )}
            
            {/* Study block preferences legend */}
            {preferences.length > 0 && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: courseColorMap.size > 0 ? 1 : 0 }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: '#e8f5e9', 
                      border: '2px solid #4caf50',
                      borderRadius: 0.5 
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary">
                    Horarios preferidos
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: 0.5 
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary">
                    Otros horarios
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}
        
        {view === 'day' ? (
          <Box>
            <CalendarToolbar
              label={formatDate(date)}
              onNavigate={(action: string) => {
                const newDate = new Date(date);
                if (action === 'PREV') {
                  newDate.setDate(newDate.getDate() - 1);
                } else if (action === 'NEXT') {
                  newDate.setDate(newDate.getDate() + 1);
                } else if (action === 'TODAY') {
                  newDate.setTime(new Date().getTime());
                }
                setDate(newDate);
              }}
              onView={handleViewChange}
              currentView={view as 'month' | 'week' | 'day'}
              onAddSession={() => {
                setEditingSession(null);
                setSelectedSlot(null);
                setFormDialogOpen(true);
              }}
              onStudyHours={() => router.push('/study-hours')}
            />
            <Paper 
              elevation={0} 
              sx={{ 
                mt: 2, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {dayViewEvents.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay eventos programados para este día
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {dayViewEvents.map((event, index) => {
                    const calendarEvent = event as CalendarEvent;
                    const session = calendarEvent.session;
                    const cursoId = session?.cursoId;
                    const backgroundColor = getColorForCourseId(cursoId);
                    const duration = Math.round((event.end.getTime() - event.start.getTime()) / 60000);
                    
                    return (
                      <React.Fragment key={event.id}>
                        <ListItem
                          disablePadding
                          sx={{
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <ListItemButton
                            onClick={() => handleSelectEvent(event)}
                            sx={{ py: 2, px: 3 }}
                          >
                            <Box
                              sx={{
                                width: 4,
                                height: '100%',
                                backgroundColor,
                                borderRadius: '2px',
                                mr: 2,
                                minHeight: 60,
                              }}
                            />
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {event.title}
                                  </Typography>
                                  {cursoId && (
                                    <Chip
                                      label={courseColorMap.get(cursoId)?.name || 'Curso'}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        backgroundColor: backgroundColor + '20',
                                        color: backgroundColor,
                                        border: `1px solid ${backgroundColor}40`,
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatTime(event.start)} - {formatTime(event.end)} • {duration} minutos
                                  </Typography>
                                  {session?.leccionId && (() => {
                                    const lessonName = getLessonName(session.leccionId);
                                    if (lessonName) {
                                      return (
                                        <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, fontWeight: 500, display: 'block' }}>
                                          {lessonName}
                                        </Typography>
                                      );
                                    }
                                    // If lesson name not found, it might not be loaded in userData yet
                                    // This can happen if userData hasn't refreshed with the new selection set
                                    return null;
                                  })()}
                                  {session?.subject && session.subject !== 'Estudio Personal' && !session?.leccionId && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                      {session.subject}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                        {index < dayViewEvents.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Box>
        ) : (
          <Box sx={calendarStyle}>
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
              dayPropGetter={dayPropGetter}
              components={{
                toolbar: (props: { label: string; onNavigate: (navigate: NavigateAction, date?: Date) => void; onView: (view: View) => void }) => (
                  <CalendarToolbar
                    label={props.label}
                    onNavigate={(action: string) => props.onNavigate(action as NavigateAction)}
                    onView={handleViewChange}
                    currentView={view as 'month' | 'week' | 'day'}
                    onAddSession={() => {
                      setEditingSession(null);
                      setSelectedSlot(null);
                      setFormDialogOpen(true);
                    }}
                    onStudyHours={() => router.push('/study-hours')}
                  />
                ),
              }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              allDayMaxRows={50}
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
                showMore: (total: number) => `+${total} más`,
              }}
            />
          </Box>
        )}
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
              // UPDATE: Optimistic update
              const updatedSession: StudySession = {
                ...editingSession,
                title: formData.leccionId ? '📖 Lección' : formData.cursoId ? '📚 Curso' : 'Sesión de estudio',
                subject: formData.cursoId || 'Estudio Personal',
                startTime: startDateTime,
                endTime: endDateTime,
                updatedAt: new Date(),
                cursoId: formData.cursoId || undefined,
                leccionId: formData.leccionId || undefined,
              };

              // Optimistic update: Update in UI immediately
              setOptimisticSessions(prev => 
                prev.map(s => s.id === editingSession.id ? updatedSession : s)
              );
              setIsOptimisticUpdate(true);

              try {
                const result = await updateSession({
                  sesionEstudioId: editingSession.id,
                  fecha: formData.startDate,
                  hora_inicio: formData.startTime,
                  hora_fin: formData.endTime,
                  duracion_minutos,
                  tipo: 'estudio' as const,
                  estado: 'programada' as const,
                  cursoId: formData.cursoId || undefined,
                  leccionId: formData.leccionId || undefined,
                });
                success = result !== null;
                
                if (success) {
                  // Success: Keep optimistic update until real data arrives
                  // Don't clear isOptimisticUpdate - let it persist until next fetch
                } else {
                  // Error: Revert optimistic update
                  setOptimisticSessions(prev => 
                    prev.map(s => s.id === editingSession.id ? editingSession : s)
                  );
                  setIsOptimisticUpdate(false);
                }
              } catch (error) {
                // Error: Revert optimistic update
                setOptimisticSessions(prev => 
                  prev.map(s => s.id === editingSession.id ? editingSession : s)
                );
                setIsOptimisticUpdate(false);
                throw error;
              }
            } else {
              // CREATE: Optimistic update
              const sessionId = crypto.randomUUID();
              const newSession: StudySession = {
                id: sessionId,
                title: formData.leccionId ? '📖 Lección' : formData.cursoId ? '📚 Curso' : 'Sesión de estudio',
                subject: formData.cursoId || 'Estudio Personal',
                startTime: startDateTime,
                endTime: endDateTime,
                description: '',
                location: '',
                priority: 'medium',
                status: 'planned',
                reminder: 15,
                tags: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                cursoId: formData.cursoId || undefined,
                leccionId: formData.leccionId || undefined,
              };

              // Optimistic update: Add to UI immediately
              setOptimisticSessions(prev => [...prev, newSession]);
              setIsOptimisticUpdate(true);

              try {
                const sessionData = {
                  sesionEstudioId: sessionId,
                  usuarioId: userData.usuarioId,
                  fecha: formData.startDate,
                  hora_inicio: formData.startTime,
                  hora_fin: formData.endTime,
                  duracion_minutos,
                  tipo: 'estudio' as const,
                  estado: 'programada' as const,
                  cursoId: formData.cursoId || undefined,
                  leccionId: formData.leccionId || undefined,
                  google_event_id: undefined,
                  recordatorios: undefined,
                };
                
                const result = await createSession(sessionData);
                success = result !== null;
                
                if (success) {
                  // Success: Keep optimistic update until real data arrives
                  // Don't clear isOptimisticUpdate - let it persist until next fetch
                } else {
                  // Error: Revert optimistic update
                  setOptimisticSessions(prev => prev.filter(s => s.id !== sessionId));
                  setIsOptimisticUpdate(false);
                }
              } catch (error) {
                // Error: Revert optimistic update
                setOptimisticSessions(prev => prev.filter(s => s.id !== sessionId));
                setIsOptimisticUpdate(false);
                throw error;
              }
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