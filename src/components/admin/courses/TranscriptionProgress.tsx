'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import type { TranscriptionJobStatus } from '@/types/transcription';

interface TranscriptionProgressProps {
  status: TranscriptionJobStatus;
  requestId: string | null;
  onStatusUpdate?: (status: TranscriptionJobStatus) => void;
}

export function TranscriptionProgress({ 
  status, 
  requestId, 
  onStatusUpdate 
}: TranscriptionProgressProps) {
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (requestId && (status.status === 'pending' || status.status === 'processing')) {
      setIsPolling(true);
      
      const pollStatus = async () => {
        try {
          const response = await fetch(`/api/transcribe-course?requestId=${requestId}`);
          if (response.ok) {
            const updatedStatus = await response.json();
            onStatusUpdate?.(updatedStatus);
            
            if (updatedStatus.status === 'completed' || updatedStatus.status === 'failed') {
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
          setIsPolling(false);
        }
      };

      const interval = setInterval(pollStatus, 3000); // Poll cada 3 segundos
      
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [requestId, status.status, onStatusUpdate]);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return <HourglassIcon color="warning" />;
      case 'processing':
        return <PlayIcon color="info" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'pending':
        return 'En cola para procesamiento';
      case 'processing':
        return 'Transcribiendo con Gemini AI...';
      case 'completed':
        return 'Transcripción completada';
      case 'failed':
        return 'Error en la transcripción';
    }
  };

  const handleDownload = () => {
    if (status.result) {
      const blob = new Blob([JSON.stringify(status.result, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcripcion-${requestId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {getStatusIcon()}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Estado de la Transcripción
        </Typography>
        <Chip 
          label={getStatusText()} 
          color={getStatusColor()} 
          variant="outlined"
        />
      </Box>

      {(status.status === 'pending' || status.status === 'processing') && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            color={getStatusColor() as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isPolling ? 'Actualizando estado...' : 'Procesando video...'}
          </Typography>
        </Box>
      )}

      {status.status === 'failed' && status.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Error en el procesamiento:
          </Typography>
          <Typography variant="body2">
            {status.error}
          </Typography>
        </Alert>
      )}

      {status.status === 'completed' && status.result && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Transcripción completada exitosamente! El contenido ha sido procesado con Gemini AI.
          </Alert>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mb: 2 }}
          >
            Descargar Transcripción
          </Button>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                Ver Resultado de la Transcripción
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(status.result, null, 2)}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {requestId && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          ID de solicitud: {requestId}
        </Typography>
      )}
    </Paper>
  );
}