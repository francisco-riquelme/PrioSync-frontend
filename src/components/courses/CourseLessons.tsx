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
  Snackbar,
  Alert,
  Button,
  Tooltip,
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
import type { ModuloWithLecciones, LeccionFromModulo, MaterialFromCourse } from './hooks/useCourseDetailData';
import GenerateMaterialButton from './GenerateMaterialButton';
import { useCrearQuestionario } from "../quiz/hooks/useCrearQuestionario";

interface CourseLessonsProps {
  modulos: ModuloWithLecciones[];
  loading: boolean;
  onQuizCreated?: () => void;
  materiales?: MaterialFromCourse[];
  onMaterialCreated?: () => void;
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

function ModuloGenerateButton({ 
  moduloId, 
  modulo, 
  usuarioId, 
  creating, 
  setCreating, 
  onNotify,
  onQuizCreated
}: { 
  moduloId: string; 
  modulo: ModuloWithLecciones;
  usuarioId: string;
  creating: Record<string, boolean>; 
  setCreating: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; 
  onNotify?: (msg: string, severity?: 'success' | 'error' | 'info') => void;
  onQuizCreated?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const crearHook = useCrearQuestionario({ onSuccess: onQuizCreated });
  const { progreso, leccionesCompletadas, totalLecciones } = useProgresoModulo({ modulo, usuarioId });

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setCreating((prev: Record<string, boolean>) => ({ ...prev, [moduloId]: true }));

      // Check if user has completed more than 70% of lessons
      if (progreso < 70) {
        const message = `Debes completar al menos el 70% de las lecciones del módulo para generar el cuestionario. Progreso actual: ${progreso}% (${leccionesCompletadas}/${totalLecciones} lecciones)`;
        if (onNotify) onNotify(message, 'info');
        return;
      }

      await crearHook.crear(moduloId);

      if (onNotify) onNotify('Cuestionario generado correctamente', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error generando cuestionario:', message, err);
      if (onNotify) onNotify(message, 'error');
    } finally {
      setLoading(false);
      setCreating(prev => ({ ...prev, [moduloId]: false }));
    }
  };

  const isDisabled = loading || !!creating[moduloId] || progreso < 70;

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleGenerate();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      handleGenerate();
    }
  };

  return (
    <Tooltip 
      title={progreso < 70 ? `Completa al menos el 70% de las lecciones (${progreso}% actual)` : 'Generar cuestionario del módulo'} 
      placement="top"
    >
      <span>
        <Button
          component="span"
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          variant="contained"
          size="small"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ 
            textTransform: 'none',
            minWidth: '160px',
            borderRadius: '20px',
            backgroundColor: isDisabled ? undefined : 'rgb(0, 150, 136)',
            '&:hover': {
              backgroundColor: isDisabled ? undefined : 'rgb(0, 121, 107)',
            },
          }}
        >
          {loading ? 'Generando...' : progreso < 70 ? `Progreso: ${progreso}%` : 'Generar Quiz del Módulo'}
        </Button>
      </span>
    </Tooltip>
  );
}

// Componente que encapsula el Accordion por módulo y decide si mostrar el botón de generar
function ModuleBlock({
  modulo,
  expanded,
  onChange,
  userId,
  creating,
  setCreating,
  onNotify,
  onQuizCreated,
  materiales,
  onMaterialCreated,
}: {
  modulo: ModuloWithLecciones;
  expanded: boolean;
  onChange: (e: React.SyntheticEvent, isExpanded: boolean) => void;
  userId?: string | null;
  creating: Record<string, boolean>;
  setCreating: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onNotify?: (msg: string, severity?: 'success' | 'error' | 'info') => void;
  onQuizCreated?: () => void;
  materiales?: MaterialFromCourse[];
  onMaterialCreated?: () => void;
}) {
  const moduleMaterial = materiales?.find((m) =>
    modulo.Lecciones ? modulo.Lecciones.some((l) => l.leccionId === m.leccionId) : false
  );
  const hasMaterial = !!moduleMaterial;
  const { progreso, loading: progresoLoading } = useProgresoModulo({ modulo, usuarioId: userId || '' });
  const allowExtended = !progresoLoading && progreso === 100;

  return (
    <Accordion
      expanded={expanded}
      onChange={onChange}
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

        {/* Mostrar botón de generar si el usuario está logueado */}
        {userId && (
          <Box sx={{ ml: 2 }} onClick={(e) => e.stopPropagation()}>
            <ModuloGenerateButton
              moduloId={modulo.moduloId}
              modulo={modulo}
              usuarioId={userId}
              creating={creating}
              setCreating={setCreating}
              onNotify={onNotify}
              onQuizCreated={onQuizCreated}
            />
          </Box>
        )}

        {/* Botón para generar material - siempre habilitado si no existe material para el módulo */}
        {userId && (
          <Box sx={{ ml: 1 }} onClick={(e) => e.stopPropagation()}>
            <GenerateMaterialButton
              moduloId={modulo.moduloId}
              label={hasMaterial ? 'Material existente' : 'Generar Material'}
              disabled={!!hasMaterial}
              allowExtended={allowExtended}
              onSuccess={() => {
                if (onNotify) onNotify('Material generado correctamente', 'success');
                if (onMaterialCreated) onMaterialCreated();
              }}
            />
          </Box>
        )}

        {/* Si existe material asociado, mostrar acceso rápido al detalle del material */}
        {userId && hasMaterial && moduleMaterial && (
          <Box sx={{ ml: 1 }} onClick={(e) => e.stopPropagation()}>
            <IconButton
              component={NextLink}
              href={`/courses/material/${moduleMaterial.materialEstudioId}`}
              size="small"
              color="primary"
              title="Ver material del módulo"
              aria-label="Ver material del módulo"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        )}

        {/* Barra de progreso del módulo */}
        {userId && (
          <Box sx={{ width: '100%', pl: 5, pr: 2 }}>
            <ModuloProgreso modulo={modulo} usuarioId={userId} />
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
                {[...(modulo.Lecciones || [])]
                  .sort((a: LeccionFromModulo, b: LeccionFromModulo) => (a.orden || 0) - (b.orden || 0))
                  .map((leccion: LeccionFromModulo) => (
                    <TableRow
                      key={leccion.leccionId}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          cursor: 'pointer',
                        },
                      }}
                    >
                      <TableCell>
                        <Chip label={leccion.orden || '-'} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PlayCircleIcon color="primary" fontSize="small" />
                          <Link component={NextLink} href={`/courses/lecciones/${leccion.leccionId}`} underline="hover" sx={{ fontWeight: 500, color: 'primary.main', '&:hover': { color: 'primary.dark' } }}>
                            {leccion.titulo}
                          </Link>
                          {userId && <LeccionEstadoIndicador leccionId={leccion.leccionId} usuarioId={userId} />}
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
                          <Chip label={leccion.tipo || 'N/A'} size="small" color={getMaterialTypeColor(leccion.tipo)} variant="outlined" />
                        </Box>
                      </TableCell>
                      <TableCell>{formatDuration(leccion.duracion_minutos)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton component={NextLink} href={`/courses/lecciones/${leccion.leccionId}`} size="small" color="primary" title="Ver lección">
                            <ArrowForwardIcon />
                          </IconButton>
                          {leccion.url_contenido && (
                            <IconButton component="a" href={leccion.url_contenido} target="_blank" rel="noopener noreferrer" size="small" color="secondary" title="Abrir contenido en nueva pestaña">
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
  );
}

export default function CourseLessons({ modulos, loading, onQuizCreated, materiales, onMaterialCreated }: CourseLessonsProps) {
  const [expandedModule, setExpandedModule] = useState<string | false>(false);
  const { userData } = useUser();
  const [creating, setCreating] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });

  const onNotify = (msg: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message: msg, severity });
  };

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

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
    <>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Módulos y Lecciones del Curso
        </Typography>

        {modulos.length > 0 ? (
          <Box sx={{ mb: 4 }}>
            {modulos
              .slice()
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((modulo) => (
                <ModuleBlock
                  key={modulo.moduloId}
                  modulo={modulo}
                  expanded={expandedModule === modulo.moduloId}
                  onChange={handleModuleChange(modulo.moduloId)}
                  userId={userData?.usuarioId}
                  creating={creating}
                  setCreating={setCreating}
                  onNotify={onNotify}
                  onQuizCreated={onQuizCreated}
                  materiales={materiales}
                  onMaterialCreated={onMaterialCreated}
                />
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
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
