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
          console.log(`Polling status for requestId: ${requestId}`);
          
          const response = await fetch(`/api/transcribe-course?requestId=${requestId}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const updatedStatus = await response.json();
          console.log('Status response:', updatedStatus);
          
          if (onStatusUpdate) {
            onStatusUpdate(updatedStatus);
          }
          
          // Si está completado o falló, detener el polling
          if (updatedStatus.status === 'completed' || updatedStatus.status === 'failed') {
            setIsPolling(false);
          }
        } catch (error) {
          console.error('Error polling status:', error);
          
          // Crear un status de error
          const errorStatus: TranscriptionJobStatus = {
            requestId: requestId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Error desconocido al verificar estado',
            timestamp: new Date().toISOString()
          };
          
          if (onStatusUpdate) {
            onStatusUpdate(errorStatus);
          }
          
          setIsPolling(false);
        }
      };

      // Hacer el primer poll inmediatamente
      pollStatus();
      
      // Luego continuar cada 3 segundos
      const interval = setInterval(pollStatus, 3000);
      
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
            color={getStatusColor() as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isPolling ? 'Verificando estado... (cada 3 segundos)' : 'Procesando video...'}
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

      {status.status === 'completed' && (status.transcriptionText || status.enrichedContent) && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Transcripción completada exitosamente! El contenido ha sido procesado con Gemini AI.
          </Alert>

          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {status.transcriptionText && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([status.transcriptionText!], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = `transcripcion_literal_${status.requestId}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                Descargar Transcripción Literal
              </Button>
            )}
            
            {status.enrichedContent && (
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([status.enrichedContent!], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = `contenido_educativo_${status.requestId}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                Descargar Contenido Educativo
              </Button>
            )}
          </Box>

          {/* Análisis y Estructura Educativa */}
          {status.analysis && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  📊 Análisis Educativo
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Resumen:</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {status.analysis.summary}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Temas Clave:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {status.analysis.keyTopics?.map((topic: string, index: number) => (
                        <Chip key={index} label={topic} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Nivel de Dificultad:</Typography>
                    <Chip 
                      label={status.analysis.difficulty} 
                      color={
                        status.analysis.difficulty === 'básico' ? 'success' : 
                        status.analysis.difficulty === 'intermedio' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </Box>

                  {status.analysis.recommendations && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Recomendaciones:</Typography>
                      <ul>
                        {status.analysis.recommendations.map((rec: string, index: number) => (
                          <li key={index}>
                            <Typography variant="body2">{rec}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Contenido Educativo Enriquecido */}
          {status.enrichedContent && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  📚 Contenido Educativo Enriquecido
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                  <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {status.enrichedContent}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Transcripción Literal */}
          {status.transcriptionText && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  🎙️ Transcripción Literal
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {status.transcriptionText}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}

      {/* Fallback para formato antiguo */}
      {status.status === 'completed' && status.result && !status.transcriptionText && !status.enrichedContent && (
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