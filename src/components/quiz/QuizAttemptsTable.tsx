'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Replay,
  Visibility,
} from '@mui/icons-material';
import { QuizAttempt } from './hooks/useQuizAttempts';

interface QuizAttemptsTableProps {
  attempts: QuizAttempt[];
  currentAttemptNumber: number;
  onContinueAttempt?: (attempt: QuizAttempt) => void;
  onReviewAttempt?: (attempt: QuizAttempt) => void;
}

const QuizAttemptsTable: React.FC<QuizAttemptsTableProps> = ({
  attempts,
  currentAttemptNumber,
  onContinueAttempt,
  onReviewAttempt,
}) => {
  const getStatusIcon = (estado?: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />;
      case 'en_proceso':
        return <HourglassEmpty sx={{ fontSize: 20, color: 'warning.main' }} />;
      case 'pendiente':
        return <HourglassEmpty sx={{ fontSize: 20, color: 'info.main' }} />;
      default:
        return <Cancel sx={{ fontSize: 20, color: 'error.main' }} />;
    }
  };

  const getStatusColor = (estado?: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch (estado) {
      case 'completado':
        return 'success';
      case 'en_proceso':
        return 'warning';
      case 'pendiente':
        return 'info';
      default:
        return 'error';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Historial de Intentos
          </Typography>
          <Chip
            label={`Intento #${currentAttemptNumber}`}
            color="primary"
            size="small"
          />
        </Box>

        {attempts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Aún no has realizado ningún intento.
              <br />
              ¡Comienza ahora!
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="right"><strong>Puntaje</strong></TableCell>
                  <TableCell align="center"><strong>Resultado</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell align="center"><strong>Acción</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...attempts]
                  .sort((a, b) => (b.intento_numero || 0) - (a.intento_numero || 0))
                  .map((attempt) => (
                    <TableRow
                      key={attempt.progresoCuestionarioId}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {attempt.intento_numero}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(attempt.estado || undefined)}
                          <Chip
                            label={
                              attempt.estado === 'completado'
                                ? 'Completado'
                                : attempt.estado === 'en_proceso'
                                ? 'En Progreso'
                                : 'Pendiente'
                            }
                            color={getStatusColor(attempt.estado || undefined)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {attempt.puntaje_obtenido || 0} pts
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {attempt.estado === 'completado' && attempt.aprobado !== undefined ? (
                          <Chip
                            label={attempt.aprobado ? 'Aprobado' : 'No Aprobado'}
                            color={attempt.aprobado ? 'success' : 'error'}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(attempt.fecha_completado || undefined)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {attempt.estado === 'en_proceso' && onContinueAttempt && (
                            <Button
                              size="small"
                              startIcon={<Replay />}
                              onClick={() => onContinueAttempt(attempt)}
                              color="primary"
                              variant="outlined"
                            >
                              Continuar
                            </Button>
                          )}
                          {attempt.estado === 'completado' && onReviewAttempt && (
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => onReviewAttempt(attempt)}
                              color="secondary"
                              variant="outlined"
                            >
                              Revisar
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {attempts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Mejor Puntaje: {Math.max(...attempts.map(a => a.puntaje_obtenido || 0))} pts
            </Typography>
            {' · '}
            <Typography variant="caption" color="text.secondary">
              Total de Intentos: {attempts.length}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizAttemptsTable;

