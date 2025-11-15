'use client';

import React, { useState, useEffect } from 'react';
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
import { getQueryFactories } from '@/utils/commons/queries';
import { MainTypes } from '@/utils/api/schema';
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
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [maxPoints, setMaxPoints] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Fetch question counts and max points for each quiz
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!cuestionarios || cuestionarios.length === 0) {
        setLoadingCounts(false);
        return;
      }

      try {
        const { Pregunta } = await getQueryFactories<
          Pick<MainTypes, 'Pregunta'>,
          'Pregunta'
        >({
          entities: ['Pregunta'],
        });

        const counts: Record<string, number> = {};
        const points: Record<string, number> = {};

        for (const cuestionario of cuestionarios) {
          const result = await Pregunta.list({
            filter: {
              cuestionarioId: { eq: cuestionario.cuestionarioId },
            },
            selectionSet: ['preguntaId', 'peso_puntos'],
          });
          
          counts[cuestionario.cuestionarioId] = result.items?.length || 0;
          
          // Calcular puntos máximos sumando peso_puntos de todas las preguntas
          const totalPoints = result.items?.reduce((sum, pregunta) => {
            return sum + (pregunta.peso_puntos || 1);
          }, 0) || 0;
          points[cuestionario.cuestionarioId] = totalPoints;
        }

        setQuestionCounts(counts);
        setMaxPoints(points);
      } catch (error) {
        console.error('Error fetching question data:', error);
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchQuestionData();
  }, [cuestionarios]);

  // Debug: Log the quizzes data
  console.log('📊 CourseQuizzes - cuestionarios:', cuestionarios);
  console.log('📊 CourseQuizzes - loading:', loading);
  console.log('📊 CourseQuizzes - cuestionarios length:', cuestionarios?.length || 0);
  console.log('📊 CourseQuizzes - questionCounts:', questionCounts);
  console.log('📊 CourseQuizzes - maxPoints:', maxPoints);

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
                    Tiempo límite
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
                        {loadingCounts ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {questionCounts[cuestionario.cuestionarioId] || 0}
                          </Typography>
                        )}
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
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            justifyContent: 'center',
                          }}
                        >
                          <TrophyIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          {loadingCounts ? (
                            <CircularProgress size={16} />
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {maxPoints[cuestionario.cuestionarioId] || 0}
                            </Typography>
                          )}
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
