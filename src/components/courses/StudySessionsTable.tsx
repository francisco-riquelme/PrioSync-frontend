'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { useStudySessions } from './hooks/useStudySessions';


interface StudySessionsTableProps {
  courseId: string;
  usuarioId?: string;
}

export default function StudySessionsTable({ courseId, usuarioId }: StudySessionsTableProps) {
  const { sessions, loading, error,  } = useStudySessions(courseId, usuarioId);

  const formatTime = (time: string) => {
    // Format time from HH:MM:SS to HH:MM
    return time.substring(0, 5);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSessionStatusColor = (estado: string | null | undefined): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (estado) {
      case 'completada': return 'success';
      case 'programada': return 'primary';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  const getSessionTypeColor = (tipo: string | null | undefined): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (tipo) {
      case 'estudio': return 'primary';
      case 'repaso': return 'secondary';
      case 'examen': return 'warning';
      default: return 'default';
    }
  };

  const getSessionTypeLabel = (tipo: string | null | undefined) => {
    switch (tipo) {
      case 'estudio': return 'Estudio';
      case 'repaso': return 'Repaso';
      case 'examen': return 'Examen';
      default: return 'N/A';
    }
  };

  const getSessionStatusLabel = (estado: string | null | undefined) => {
    switch (estado) {
      case 'programada': return 'Programada';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return 'N/A';
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Sesiones de Estudio
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Sesiones de Estudio
        </Typography>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Sesiones de Estudio
      </Typography>

      {sessions.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Hora Inicio</TableCell>
                <TableCell>Hora Fin</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Recordatorios</TableCell>
                <TableCell align="center">Google Meet</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.sesionEstudioId}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" color="action" />
                      {formatDate(session.fecha)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      {formatTime(session.hora_inicio)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      {formatTime(session.hora_fin)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {session.duracion_minutos ? `${session.duracion_minutos} min` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getSessionTypeLabel(session.tipo)}
                      size="small"
                      color={getSessionTypeColor(session.tipo)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getSessionStatusLabel(session.estado)}
                      size="small"
                      color={getSessionStatusColor(session.estado)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {session.recordatorios || '-'}
                  </TableCell>
                  <TableCell align="center">
                    {session.google_event_id ? (
                      <IconButton
                        component="a"
                        href={`https://${session.google_event_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        color="primary"
                        title="Unirse a Google Meet"
                      >
                        <VideoCallIcon />
                      </IconButton>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay sesiones de estudio programadas para este curso.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
