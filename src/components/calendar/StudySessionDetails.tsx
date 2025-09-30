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
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { StudySessionDetailsProps } from './componentTypes';

const StudySessionDetails: React.FC<StudySessionDetailsProps> = ({
  open,
  onClose,
  onEdit,
  onDelete,
  session
}) => {
  if (!session) return null;

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle 
        component="div"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pb: 1 
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Detalles de la Sesión
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Título */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {session.title}
          </Typography>
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
            <strong>Inicio:</strong> {formatDateTime(session.startTime)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Fin:</strong> {formatDateTime(session.endTime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duración: {getDuration()}
          </Typography>
        </Box>

        {/* Fechas de creación */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Creado: {formatDateTime(session.createdAt)}
          </Typography>
          {session.updatedAt && session.updatedAt !== session.createdAt && (
            <Typography variant="body2" color="text.secondary">
              Actualizado: {formatDateTime(session.updatedAt)}
            </Typography>
          )}
        </Box>
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