'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Alert,
  IconButton,
  Link,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  ArrowForward as ArrowForwardIcon,
  PlayCircleOutline as PlayCircleIcon,
  BookOutlined as BookIcon,
} from '@mui/icons-material';
import { useLecciones } from './hooks/useLecciones';
import { getLessonTypeIcon, getMaterialTypeColor, formatDuration } from './courseUtils';

interface CourseLessonsProps {
  courseId: string;
}

export default function CourseLessons({ courseId }: CourseLessonsProps) {
  const { modulos, loading, error } = useLecciones({ 
    cursoId: courseId
  });
  const [expandedModule, setExpandedModule] = useState<string | false>(false);

  const handleModuleChange = (moduleId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedModule(isExpanded ? moduleId : false);
  };

  // Loading state
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Módulos y Lecciones del Curso
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Módulos y Lecciones del Curso
        </Typography>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
        Módulos y Lecciones del Curso
      </Typography>

      {modulos.length > 0 ? (
        <Box sx={{ mb: 4 }}>
          {modulos.map((modulo) => (
            <Accordion
              key={modulo.moduloId}
              expanded={expandedModule === modulo.moduloId}
              onChange={handleModuleChange(modulo.moduloId)}
              sx={{
                mb: 2,
                '&:before': {
                  display: 'none',
                },
                boxShadow: 2,
                borderRadius: 2,
                '&.Mui-expanded': {
                  margin: '16px 0',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: 'primary.50',
                  borderRadius: '8px 8px 0 0',
                  '&.Mui-expanded': {
                    borderRadius: '8px 8px 0 0',
                  },
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 2,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <BookIcon color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {modulo.titulo}
                    </Typography>
                    {modulo.descripcion && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {modulo.descripcion}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={`Módulo ${modulo.orden || '-'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {modulo.duracion_estimada && (
                      <Chip
                        label={formatDuration(modulo.duracion_estimada)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      label={`${modulo.Lecciones?.length || 0} lecciones`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {modulo.Lecciones && modulo.Lecciones.length > 0 ? (
                  <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.50' }}>
                          <TableCell>Orden</TableCell>
                          <TableCell>Título</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Duración</TableCell>
                          <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {modulo.Lecciones
                          .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                          .map((leccion) => (
                            <TableRow 
                              key={leccion.leccionId}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'action.hover',
                                  cursor: 'pointer' 
                                } 
                              }}
                            >
                              <TableCell>
                                <Chip
                                  label={leccion.orden || '-'}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PlayCircleIcon color="primary" fontSize="small" />
                                  <Link
                                    component={NextLink}
                                    href={`/courses/lecciones/${leccion.leccionId}`}
                                    underline="hover"
                                    sx={{ 
                                      fontWeight: 500,
                                      color: 'primary.main',
                                      '&:hover': {
                                        color: 'primary.dark'
                                      }
                                    }}
                                  >
                                    {leccion.titulo}
                                  </Link>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                                  {leccion.descripcion || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getLessonTypeIcon(leccion.tipo)}
                                  <Chip
                                    label={leccion.tipo || 'N/A'}
                                    size="small"
                                    color={getMaterialTypeColor(leccion.tipo)}
                                    variant="outlined"
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                {formatDuration(leccion.duracion_minutos)}
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                  <IconButton
                                    component={NextLink}
                                    href={`/courses/lecciones/${leccion.leccionId}`}
                                    size="small"
                                    color="primary"
                                    title="Ver lección"
                                  >
                                    <ArrowForwardIcon />
                                  </IconButton>
                                  {leccion.url_contenido && (
                                    <IconButton
                                      component="a"
                                      href={leccion.url_contenido}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="small"
                                      color="secondary"
                                      title="Abrir contenido en nueva pestaña"
                                    >
                                      <OpenInNewIcon />
                                    </IconButton>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay lecciones disponibles en este módulo.
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No hay módulos disponibles para este curso.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
