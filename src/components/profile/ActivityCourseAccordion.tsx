'use client';

import React from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { School as SchoolIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { formatearFechaAbsoluta } from '@/utils/dateHelpers';
import { ActividadPorCurso } from '@/hooks/useActividadUsuario';
import { getActividadIcon } from './profileUtils';

interface ActivityCourseAccordionProps {
  curso: ActividadPorCurso;
  progreso: number;
  defaultExpanded?: boolean;
}

export default function ActivityCourseAccordion({
  curso,
  progreso,
  defaultExpanded = false,
}: ActivityCourseAccordionProps) {
  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 1 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
          <SchoolIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {curso.cursoNombre}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={`${curso.actividades.length} ${
                  curso.actividades.length === 1 ? 'actividad' : 'actividades'
                }`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {progreso > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 100 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progreso}
                    sx={{
                      width: 60,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'success.light',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'success.main',
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 500, color: 'success.main' }}>
                    {progreso}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <List sx={{ pt: 0 }}>
          {curso.actividades.map((actividad, index) => (
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
              {index < curso.actividades.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

