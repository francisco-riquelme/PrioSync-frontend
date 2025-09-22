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
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Subject as SubjectIcon,
} from '@mui/icons-material';
import { StudySession, PRIORITY_OPTIONS } from '@/types/studySession';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: StudySession | null;
  loading?: boolean;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  session,
  loading = false
}) => {
  if (!session) return null;

  const priorityOption = PRIORITY_OPTIONS.find(p => p.value === session.priority);
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 2 }}>
        <WarningIcon color="warning" />
        <Typography variant="h6">
          Confirmar Eliminación
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta acción no se puede deshacer. La sesión de estudio será eliminada permanentemente.
        </Alert>

        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {session.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SubjectIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {session.subject}
            </Typography>
            {priorityOption && (
              <Chip 
                label={priorityOption.label}
                size="small"
                sx={{ 
                  backgroundColor: priorityOption.color,
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(session.startTime)}
            </Typography>
          </Box>

          {session.description && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              &ldquo;{session.description}&rdquo;
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          ¿Estás seguro de que quieres eliminar esta sesión de estudio?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;