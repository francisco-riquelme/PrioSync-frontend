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
  IconButton,
  Link,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  ArrowForward as ArrowForwardIcon,
  PlayCircleOutline as PlayCircleIcon,
  BookOutlined as BookIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { getLessonTypeIcon, getMaterialTypeColor, formatDuration } from './courseUtils';
import { useProgresoModulo } from './hooks/useProgresoModulo';
import { useProgresoLeccion } from './hooks/useProgresoLeccion';
import { useUser } from '@/contexts/UserContext';
import type { ModuloWithLecciones, LeccionFromModulo } from './hooks/useCourseDetailData';

interface CourseLessonsProps {
  modulos: ModuloWithLecciones[];
  loading: boolean;
}

// Componente para mostrar progreso de un módulo
function ModuloProgreso({ modulo, usuarioId }: { modulo: ModuloWithLecciones; usuarioId: string }) {
  const { progreso, leccionesCompletadas, totalLecciones } = useProgresoModulo({
    modulo,
    usuarioId,
  });




  return (
    <Box sx={{ minWidth: 200 }} key={`${modulo.moduloId}-${progreso}-${leccionesCompletadas}`}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {leccionesCompletadas} de {totalLecciones} completadas
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {progreso}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progreso}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            backgroundColor: progreso === 100 ? 'success.main' : 'primary.main',
          },
        }}
      />
    </Box>
  );
}

// Componente para indicar si una lección está completada
function LeccionEstadoIndicador({ leccionId, usuarioId }: { leccionId: string; usuarioId: string }) {
  const { isCompleted } = useProgresoLeccion({ leccionId, usuarioId });

  if (!isCompleted) return null;

  return (
    <CheckCircleIcon 
      color="success" 
      fontSize="small" 
      sx={{ ml: 1 }}
      titleAccess="Lección completada"
    />
  );
}

export default function CourseLessons({ modulos, loading }: CourseLessonsProps) {
  const [expandedModule, setExpandedModule] = useState<string | false>(false);
  const { userData } = useUser();

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
                    flexDirection: 'column',
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
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
                {/* Barra de progreso del módulo */}
                {userData && (
                  <Box sx={{ width: '100%', pl: 5, pr: 2 }}>
                    <ModuloProgreso modulo={modulo} usuarioId={userData.usuarioId} />
                  </Box>
                )}
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
                          .sort((a: LeccionFromModulo, b: LeccionFromModulo) => (a.orden || 0) - (b.orden || 0))
                          .map((leccion: LeccionFromModulo) => (
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
                                  {userData && (
                                    <LeccionEstadoIndicador 
                                      leccionId={leccion.leccionId} 
                                      usuarioId={userData.usuarioId} 
                                    />
                                  )}
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
