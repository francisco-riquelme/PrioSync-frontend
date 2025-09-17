'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Subject as SubjectIcon,
  LocationOn as LocationIcon,
  Notes as NotesIcon,
  Notifications as NotificationsIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';
import { StudySession, PRIORITY_OPTIONS } from '@/types/studySession';

interface StudySessionDetailsProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  session: StudySession | null;
}

const StudySessionDetails: React.FC<StudySessionDetailsProps> = ({
  open,
  onClose,
  onEdit,
  onDelete,
  session
}) => {
  if (!session) return null;

  const priorityOption = PRIORITY_OPTIONS.find(p => p.value === session.priority);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDuration = () => {
    const diffMs = session.endTime.getTime() - session.startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Detalles de la Sesión
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Título y Prioridad */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {session.title}
          </Typography>
          {priorityOption && (
            <Chip 
              label={priorityOption.label}
              sx={{ 
                backgroundColor: priorityOption.color,
                color: 'white',
                fontWeight: 500
              }}
            />
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Información de Tiempo */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Horario
            </Typography>
          </Box>
          <Typography variant="body1" gutterBottom>
            {formatDate(session.startTime)}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formatTime(session.startTime)} - {formatTime(session.endTime)} ({getDuration()})
          </Typography>
        </Box>

        {/* Materia */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SubjectIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Materia
            </Typography>
          </Box>
          <Typography variant="body1">
            {session.subject}
          </Typography>
        </Box>

        {/* Ubicación */}
        {session.location && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Ubicación
              </Typography>
            </Box>
            <Typography variant="body1">
              {session.location}
            </Typography>
          </Box>
        )}

        {/* Descripción */}
        {session.description && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <NotesIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Descripción
              </Typography>
            </Box>
            <Typography variant="body1">
              {session.description}
            </Typography>
          </Box>
        )}

        {/* Recordatorio */}
        {session.reminder && session.reminder > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <NotificationsIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recordatorio
              </Typography>
            </Box>
            <Typography variant="body1">
              {session.reminder} minutos antes
            </Typography>
          </Box>
        )}

        {/* Tags */}
        {session.tags && session.tags.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TagIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Etiquetas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {session.tags.map((tag, index) => (
                <Chip 
                  key={index}
                  label={tag}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onEdit}
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ flex: 1 }}
        >
          Editar
        </Button>
        <Button
          onClick={onDelete}
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          sx={{ flex: 1 }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudySessionDetails;