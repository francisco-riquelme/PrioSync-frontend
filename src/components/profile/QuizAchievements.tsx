'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as PlatinumIcon,
} from '@mui/icons-material';
import { useActividadUsuario } from '@/hooks/useActividadUsuario';
import { formatearFechaAbsoluta } from '@/utils/dateHelpers';

interface BadgeCount {
  type: string;
  count: number;
  icon: React.ComponentType<{ sx?: Record<string, unknown> }>;
  bg: string;
  color: string;
  label: string;
}

export default function QuizAchievements() {
  const { actividades, loading: actividadesLoading, error: actividadesError } = useActividadUsuario();

  // Filtrar solo cuestionarios
  const cuestionarios = useMemo(() => {
    if (!actividades || actividades.length === 0) return [];
    return actividades.filter(actividad => actividad.tipo === 'quiz');
  }, [actividades]);

  // Calcular resumen de emblemas/trofeos
  const resumenEmblemas = useMemo(() => {
    if (!cuestionarios || cuestionarios.length === 0) return [];

    const counts: Record<string, number> = {
      'x-roja': 0,
      'bronce-autoeval': 0,
      'plata-autoeval': 0,
      'oro-autoeval': 0,
      'platino-autoeval': 0,
      'bronce-final': 0,
      'plata-final': 0,
      'oro-final': 0,
      'platino-final': 0,
      'platino-final-grande': 0,
    };

    cuestionarios.forEach(quiz => {
      const tipoMatch = quiz.titulo.match(/^(EVALUACION|PRACTICA|autoevaluacion):/i);
      const tipoQuiz = tipoMatch ? tipoMatch[1].toLowerCase() : 'evaluacion';
      const esAutoevaluacion = tipoQuiz === 'practica' || tipoQuiz === 'autoevaluacion';

      let puntajeReal = quiz.metadata?.puntajeReal;
      let puntosMaximos = quiz.metadata?.puntosMaximos;

      if (puntajeReal === undefined || puntosMaximos === undefined) {
        puntosMaximos = esAutoevaluacion ? 10 : 20;
        const porcentaje = quiz.metadata?.puntaje || 0;
        puntajeReal = Math.round((porcentaje / 100) * puntosMaximos);
      } else {
        puntajeReal = Math.round(puntajeReal);
      }

      if (puntajeReal === 0) {
        counts['x-roja']++;
      } else if (esAutoevaluacion) {
        if (puntajeReal >= 1 && puntajeReal <= 3) counts['bronce-autoeval']++;
        else if (puntajeReal >= 4 && puntajeReal <= 6) counts['plata-autoeval']++;
        else if (puntajeReal >= 7 && puntajeReal <= 9) counts['oro-autoeval']++;
        else if (puntajeReal === 10) counts['platino-autoeval']++;
      } else {
        if (puntajeReal >= 1 && puntajeReal <= 6) counts['bronce-final']++;
        else if (puntajeReal >= 7 && puntajeReal <= 12) counts['plata-final']++;
        else if (puntajeReal >= 13 && puntajeReal <= 18) counts['oro-final']++;
        else if (puntajeReal === 19) counts['platino-final']++;
        else if (puntajeReal === 20) counts['platino-final-grande']++;
      }
    });

    const badges: BadgeCount[] = [];

    if (counts['x-roja'] > 0) {
      badges.push({
        type: 'x-roja',
        count: counts['x-roja'],
        icon: CloseIcon,
        bg: 'error.light',
        color: 'error.main',
        label: 'X Roja',
      });
    }

    if (counts['bronce-autoeval'] > 0) {
      badges.push({
        type: 'bronce-autoeval',
        count: counts['bronce-autoeval'],
        icon: TrophyIcon,
        bg: '#CD7F32',
        color: '#8B4513',
        label: 'Bronce (Autoeval.)',
      });
    }

    if (counts['plata-autoeval'] > 0) {
      badges.push({
        type: 'plata-autoeval',
        count: counts['plata-autoeval'],
        icon: TrophyIcon,
        bg: '#C0C0C0',
        color: '#808080',
        label: 'Plata (Autoeval.)',
      });
    }

    if (counts['oro-autoeval'] > 0) {
      badges.push({
        type: 'oro-autoeval',
        count: counts['oro-autoeval'],
        icon: TrophyIcon,
        bg: '#FFD700',
        color: '#B8860B',
        label: 'Oro (Autoeval.)',
      });
    }

    if (counts['platino-autoeval'] > 0) {
      badges.push({
        type: 'platino-autoeval',
        count: counts['platino-autoeval'],
        icon: PlatinumIcon,
        bg: '#E5E4E2',
        color: '#8B8B8B',
        label: 'Platino (Autoeval.)',
      });
    }

    if (counts['bronce-final'] > 0) {
      badges.push({
        type: 'bronce-final',
        count: counts['bronce-final'],
        icon: TrophyIcon,
        bg: '#CD7F32',
        color: '#8B4513',
        label: 'Bronce (Final)',
      });
    }

    if (counts['plata-final'] > 0) {
      badges.push({
        type: 'plata-final',
        count: counts['plata-final'],
        icon: TrophyIcon,
        bg: '#C0C0C0',
        color: '#808080',
        label: 'Plata (Final)',
      });
    }

    if (counts['oro-final'] > 0) {
      badges.push({
        type: 'oro-final',
        count: counts['oro-final'],
        icon: TrophyIcon,
        bg: '#FFD700',
        color: '#B8860B',
        label: 'Oro (Final)',
      });
    }

    if (counts['platino-final'] > 0) {
      badges.push({
        type: 'platino-final',
        count: counts['platino-final'],
        icon: PlatinumIcon,
        bg: '#E5E4E2',
        color: '#8B8B8B',
        label: 'Platino (Final)',
      });
    }

    if (counts['platino-final-grande'] > 0) {
      badges.push({
        type: 'platino-final-grande',
        count: counts['platino-final-grande'],
        icon: PlatinumIcon,
        bg: '#E5E4E2',
        color: '#8B8B8B',
        label: 'Platino Grande (Final)',
      });
    }

    return badges;
  }, [cuestionarios]);

  // Agrupar cuestionarios por curso y ordenar
  const cuestionariosPorCurso = useMemo(() => {
    if (!cuestionarios || cuestionarios.length === 0) return [];

    const grupos: Record<string, typeof cuestionarios> = {};

    cuestionarios.forEach(quiz => {
      const cursoId = quiz.cursoId || 'sin-curso';

      if (!grupos[cursoId]) {
        grupos[cursoId] = [];
      }
      grupos[cursoId].push(quiz);
    });

    // Convertir a array y ordenar
    return Object.entries(grupos)
      .map(([cursoId, quizzes]) => {
        // Ordenar cuestionarios: primero por puntaje (mayor a menor), luego alfabéticamente por título
        const quizzesOrdenados = [...quizzes].sort((a, b) => {
          // Calcular puntajes reales
          const tipoMatchA = a.titulo.match(/^(EVALUACION|PRACTICA|autoevaluacion):/i);
          const tipoQuizA = tipoMatchA ? tipoMatchA[1].toLowerCase() : 'evaluacion';
          const esAutoevalA = tipoQuizA === 'practica' || tipoQuizA === 'autoevaluacion';

          let puntajeA = a.metadata?.puntajeReal;
          if (puntajeA === undefined) {
            const puntosMaxA = esAutoevalA ? 10 : 20;
            const porcentajeA = a.metadata?.puntaje || 0;
            puntajeA = Math.round((porcentajeA / 100) * puntosMaxA);
          }

          const tipoMatchB = b.titulo.match(/^(EVALUACION|PRACTICA|autoevaluacion):/i);
          const tipoQuizB = tipoMatchB ? tipoMatchB[1].toLowerCase() : 'evaluacion';
          const esAutoevalB = tipoQuizB === 'practica' || tipoQuizB === 'autoevaluacion';

          let puntajeB = b.metadata?.puntajeReal;
          if (puntajeB === undefined) {
            const puntosMaxB = esAutoevalB ? 10 : 20;
            const porcentajeB = b.metadata?.puntaje || 0;
            puntajeB = Math.round((porcentajeB / 100) * puntosMaxB);
          }

          // Primero ordenar por puntaje (mayor a menor)
          if (puntajeB !== puntajeA) {
            return puntajeB - puntajeA;
          }

          // Si el puntaje es igual, ordenar alfabéticamente por título
          const tituloA = a.titulo
            .replace(/^(EVALUACION|PRACTICA|autoevaluacion):\s*/i, '')
            .replace(/^Cuestionario:\s*/i, '')
            .trim();
          const tituloB = b.titulo
            .replace(/^(EVALUACION|PRACTICA|autoevaluacion):\s*/i, '')
            .replace(/^Cuestionario:\s*/i, '')
            .trim();

          return tituloA.localeCompare(tituloB, 'es');
        });

        return {
          cursoId,
          cursoNombre: quizzes[0].cursoNombre || 'Sin curso',
          cuestionarios: quizzesOrdenados,
        };
      })
      .sort((a, b) => a.cursoNombre.localeCompare(b.cursoNombre, 'es')); // Ordenar cursos alfabéticamente
  }, [cuestionarios]);

  // Función para obtener información del emblema/trofeo
  const getBadgeInfo = (quiz: typeof cuestionarios[0]) => {
    const tipoMatch = quiz.titulo.match(/^(EVALUACION|PRACTICA|autoevaluacion):/i);
    const tipoQuiz = tipoMatch ? tipoMatch[1].toLowerCase() : 'evaluacion';
    const esAutoevaluacion = tipoQuiz === 'practica' || tipoQuiz === 'autoevaluacion';

    let puntajeReal = quiz.metadata?.puntajeReal;
    let puntosMaximos = quiz.metadata?.puntosMaximos;

    if (puntajeReal === undefined || puntosMaximos === undefined) {
      puntosMaximos = esAutoevaluacion ? 10 : 20;
      const porcentaje = quiz.metadata?.puntaje || 0;
      puntajeReal = Math.round((porcentaje / 100) * puntosMaximos);
    } else {
      puntajeReal = Math.round(puntajeReal);
    }

    if (puntajeReal === 0) {
      return {
        icon: CloseIcon,
        bg: 'error.light',
        color: 'error.main',
        size: 20,
      };
    }

    if (esAutoevaluacion) {
      if (puntajeReal === 10) {
        return {
          icon: PlatinumIcon,
          bg: '#E5E4E2',
          color: '#8B8B8B',
          size: 20,
        };
      } else if (puntajeReal >= 7 && puntajeReal <= 9) {
        return {
          icon: TrophyIcon,
          bg: '#FFD700',
          color: '#B8860B',
          size: 20,
        };
      } else if (puntajeReal >= 4 && puntajeReal <= 6) {
        return {
          icon: TrophyIcon,
          bg: '#C0C0C0',
          color: '#808080',
          size: 20,
        };
      } else if (puntajeReal >= 1 && puntajeReal <= 3) {
        return {
          icon: TrophyIcon,
          bg: '#CD7F32',
          color: '#8B4513',
          size: 20,
        };
      }
    } else {
      if (puntajeReal === 20) {
        return {
          icon: PlatinumIcon,
          bg: '#E5E4E2',
          color: '#8B8B8B',
          size: 24,
        };
      } else if (puntajeReal === 19) {
        return {
          icon: PlatinumIcon,
          bg: '#E5E4E2',
          color: '#8B8B8B',
          size: 20,
        };
      } else if (puntajeReal >= 13 && puntajeReal <= 18) {
        return {
          icon: TrophyIcon,
          bg: '#FFD700',
          color: '#B8860B',
          size: 20,
        };
      } else if (puntajeReal >= 7 && puntajeReal <= 12) {
        return {
          icon: TrophyIcon,
          bg: '#C0C0C0',
          color: '#808080',
          size: 20,
        };
      } else if (puntajeReal >= 1 && puntajeReal <= 6) {
        return {
          icon: TrophyIcon,
          bg: '#CD7F32',
          color: '#8B4513',
          size: 20,
        };
      }
    }

    return {
      icon: CloseIcon,
      bg: 'error.light',
      color: 'error.main',
      size: 20,
    };
  };

  return (
    <Box>
      {/* Resumen de Emblemas/Trofeos */}
      {resumenEmblemas.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Resumen de Logros
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              {resumenEmblemas.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <Box
                    key={badge.type}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: badge.bg,
                        color: badge.color,
                      }}
                    >
                      <BadgeIcon sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {badge.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {badge.label}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Lista de Cuestionarios por Curso */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Logros de Cuestionarios
          </Typography>

          {actividadesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : actividadesError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actividadesError}
            </Alert>
          ) : cuestionariosPorCurso.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ p: 4 }}>
              No has completado cuestionarios todavía.
            </Typography>
          ) : (
            <Box>
              {cuestionariosPorCurso.map((grupo) => (
                <Accordion key={grupo.cursoId} defaultExpanded={false} sx={{ mb: 1 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                      <SchoolIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {grupo.cursoNombre}
                        </Typography>
                        <Chip
                          label={`${grupo.cuestionarios.length} ${
                            grupo.cuestionarios.length === 1 ? 'cuestionario' : 'cuestionarios'
                          }`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ pt: 0 }}>
                    <List sx={{ pt: 0 }}>
                      {grupo.cuestionarios.map((quiz, index) => {
                        const tituloLimpio = quiz.titulo
                          .replace(/^(EVALUACION|PRACTICA|autoevaluacion):\s*/i, '')
                          .replace(/^Cuestionario:\s*/i, '')
                          .trim();

                        const tipoMatch = quiz.titulo.match(/^(EVALUACION|PRACTICA|autoevaluacion):/i);
                        const tipoQuiz = tipoMatch ? tipoMatch[1].toLowerCase() : 'evaluacion';
                        const esAutoevaluacion = tipoQuiz === 'practica' || tipoQuiz === 'autoevaluacion';

                        let puntajeReal = quiz.metadata?.puntajeReal;
                        let puntosMaximos = quiz.metadata?.puntosMaximos;

                        if (puntajeReal === undefined || puntosMaximos === undefined) {
                          puntosMaximos = esAutoevaluacion ? 10 : 20;
                          const porcentaje = quiz.metadata?.puntaje || 0;
                          puntajeReal = Math.round((porcentaje / 100) * puntosMaximos);
                        } else {
                          puntajeReal = Math.round(puntajeReal);
                        }

                        const badgeInfo = getBadgeInfo(quiz);
                        const BadgeIcon = badgeInfo.icon;
                        const aprobado = quiz.metadata?.aprobado ?? false;

                        return (
                          <React.Fragment key={quiz.id}>
                            <ListItem sx={{ px: 0, py: 1.5 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor: badgeInfo.bg,
                                  color: badgeInfo.color,
                                  mr: 2,
                                  flexShrink: 0,
                                }}
                              >
                                <BadgeIcon sx={{ fontSize: badgeInfo.size }} />
                              </Box>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {tituloLimpio}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {formatearFechaAbsoluta(quiz.fecha)}
                                  </Typography>
                                }
                              />
                              <Chip
                                label={puntajeReal}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                  height: 28,
                                  backgroundColor: aprobado ? 'success.main' : 'error.main',
                                  color: 'white',
                                  '& .MuiChip-label': {
                                    px: 1.5,
                                  },
                                }}
                              />
                            </ListItem>
                            {index < grupo.cuestionarios.length - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

