'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useCreateCourseFromPlaylist } from './hooks/useCreateCourseFromPlaylist';

interface ImportCourseModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  onWorkflowStatusChange?: (isWaiting: boolean) => void;
}

export default function ImportCourseModal({
  open,
  onClose,
  userId,
  onSuccess,
  onWorkflowStatusChange,
}: ImportCourseModalProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { loading, error, createCourse, isWaitingForWorkflow } = useCreateCourseFromPlaylist({
    onSuccess: () => {
      // Reset form
      setPlaylistUrl('');
      setValidationError(null);
      
      // Call parent success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      onClose();
    },
  });

  // Notify parent component of workflow status changes
  useEffect(() => {
    if (onWorkflowStatusChange) {
      onWorkflowStatusChange(isWaitingForWorkflow);
    }
  }, [isWaitingForWorkflow, onWorkflowStatusChange]);

  const extractPlaylistId = (url: string): string | null => {
    // Handle different YouTube playlist URL formats:
    // https://www.youtube.com/playlist?list=PLxxx
    // https://youtube.com/playlist?list=PLxxx
    // https://youtu.be/playlist?list=PLxxx
    // https://www.youtube.com/watch?v=xxx&list=PLxxx
    
    const patterns = [
      /[?&]list=([a-zA-Z0-9_-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const validateUrl = (url: string): string | null => {
    if (!url.trim()) {
      return 'Por favor ingresa una URL de playlist de YouTube';
    }
    
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return 'La URL debe ser una playlist válida de YouTube';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    // Validate URL
    const error = validateUrl(playlistUrl);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError(null);
    
    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      setValidationError('No se pudo extraer el ID de la playlist');
      return;
    }
    
    // Create course
    try {
      await createCourse(playlistId, userId);
    } catch (err) {
      // Error is already set by the hook
      console.error('Error creating course:', err);
    }
  };

  const handleClose = () => {
    // Prevent closing while loading or waiting for workflow
    if (!loading && !isWaitingForWorkflow) {
      setPlaylistUrl('');
      setValidationError(null);
      onClose();
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={isWaitingForWorkflow}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Importar Curso desde YouTube
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingresa la URL de una playlist de YouTube para crear un curso basado en sus videos.
              El proceso puede tomar unos momentos mientras procesamos el contenido.
            </Typography>
            
            {(validationError || error) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError || error}
              </Alert>
            )}
            
            <TextField
              label="URL de Playlist de YouTube"
              placeholder="https://www.youtube.com/playlist?list=PLxxxx"
              fullWidth
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              disabled={loading || isWaitingForWorkflow}
              autoFocus
            />
            
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Procesando playlist...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose} 
            disabled={loading || isWaitingForWorkflow}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || isWaitingForWorkflow || !playlistUrl.trim()}
          >
            Importar
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}

