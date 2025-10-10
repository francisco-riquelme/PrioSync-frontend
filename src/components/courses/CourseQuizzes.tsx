'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
  Button,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Timer as TimerIcon,
  ArrowForward as ArrowForwardIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import type { CuestionarioFromCourse } from './hooks/useCourseDetailData';

interface CourseQuizzesProps {
  cuestionarios: CuestionarioFromCourse[];
  loading: boolean;
}

const getQuizTypeLabel = (tipo: string) => {
  const types: Record<string, { label: string; color: 'primary' | 'secondary' | 'success' | 'warning' }> = {
    autoevaluacion: { label: 'Autoevaluación', color: 'primary' },
    prueba_final: { label: 'Prueba Final', color: 'warning' },
  };
  return types[tipo] || { label: tipo, color: 'secondary' };
};

const formatDuration = (minutes?: number | null) => {
  if (!minutes) return 'Sin límite';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export default function CourseQuizzes({ cuestionarios, loading }: CourseQuizzesProps) {
  const router = useRouter();

  // Loading state
  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Cuestionarios del Curso
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // No quizzes state
  if (!cuestionarios || cuestionarios.length === 0) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Cuestionarios del Curso
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <QuizIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No hay cuestionarios disponibles para este curso.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const handleQuizClick = (cuestionarioId: string) => {
    router.push(`/quiz?cuestionarioId=${cuestionarioId}`);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Cuestionarios del Curso
      </Typography>

      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Preguntas
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Duración
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Intentos
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Puntos
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Acción
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuestionarios.map((cuestionario) => {
                  const typeInfo = getQuizTypeLabel(cuestionario.tipo || 'autoevaluacion');

                  return (
                    <TableRow
                      key={cuestionario.cuestionarioId}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleQuizClick(cuestionario.cuestionarioId)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <QuizIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {cuestionario.titulo}
                            </Typography>
                            {cuestionario.descripcion && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {cuestionario.descripcion}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={typeInfo.label}
                          color={typeInfo.color}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2">
                          -
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            justifyContent: 'center',
                          }}
                        >
                          <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDuration(cuestionario.duracion_minutos)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="body2">
                          {cuestionario.intentos_permitidos || 'Ilimitado'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            justifyContent: 'center',
                          }}
                        >
                          <TrophyIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {cuestionario.puntos_maximos || 100}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          endIcon={<ArrowForwardIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuizClick(cuestionario.cuestionarioId);
                          }}
                          sx={{ textTransform: 'none' }}
                        >
                          Iniciar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
