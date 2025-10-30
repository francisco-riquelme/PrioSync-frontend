'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Book as BookIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useActividadUsuario } from '@/hooks/useActividadUsuario';
import { useCursosConProgreso } from '@/hooks/useCursosConProgreso';
import { formatearFechaAbsoluta } from '@/utils/dateHelpers';
import ActivityCourseAccordion from './ActivityCourseAccordion';
import { getActividadIcon } from './profileUtils';

export default function ActivityHistory() {
  const { actividadesPorCurso, actividadesSinCurso, loading: loadingActividades, error: errorActividades } =
    useActividadUsuario();
  const { cursos: cursosConProgreso } = useCursosConProgreso();

  // Helper function to get course progress
  const getProgresoCurso = (cursoId: string): number => {
    const curso = cursosConProgreso.find((c) => c.cursoId === cursoId);
    return curso?.progreso || 0;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Historial de Actividad
        </Typography>

        {loadingActividades ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : errorActividades ? (
          <Typography color="error" align="center" sx={{ p: 4 }}>
            {errorActividades}
          </Typography>
        ) : actividadesPorCurso.length === 0 && actividadesSinCurso.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ p: 4 }}>
            No hay actividades registradas todavía
          </Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* Acordeones por curso */}
            {actividadesPorCurso.map((curso) => {
              const progreso = getProgresoCurso(curso.cursoId);

              return (
                <ActivityCourseAccordion key={curso.cursoId} curso={curso} progreso={progreso} />
              );
            })}

            {/* Acordeón para actividades sin curso (solo si existen) */}
            {actividadesSinCurso.length > 0 && (
              <Accordion defaultExpanded={false} sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                    <BookIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Otras Actividades
                      </Typography>
                      <Chip
                        label={`${actividadesSinCurso.length} ${
                          actividadesSinCurso.length === 1 ? 'actividad' : 'actividades'
                        }`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 0 }}>
                  <List sx={{ pt: 0 }}>
                    {actividadesSinCurso.map((actividad, index) => (
                      <React.Fragment key={actividad.id}>
                        <ListItem sx={{ px: 0, gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getActividadIcon(actividad.tipo)}
                          </Box>
                          <ListItemText
                            primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{actividad.titulo}</Typography>}
                            secondary={actividad.subtitulo}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ minWidth: 120, textAlign: 'right' }}
                          >
                            {formatearFechaAbsoluta(actividad.fecha)}
                          </Typography>
                        </ListItem>
                        {index < actividadesSinCurso.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

