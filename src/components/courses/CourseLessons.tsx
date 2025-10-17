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
  Button,
  Snackbar,
  Alert,
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
import { usePuedeGenerarQuestionario } from "../quiz/hooks/usePuedeGenerarQuestionario";
import { useCrearQuestionario } from "../quiz/hooks/useCrearQuestionario";

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

// Pequeño componente responsable de verificar y crear el cuestionario mediante endpoints del servidor
function ModuloGenerateButton({ moduloId, creating, setCreating, onNotify }: { 
  moduloId: string; creating: Record<string, boolean>; setCreating: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; onNotify?: (msg: string, severity?: 'success' | 'error' | 'info') => void }) {
  const [loading, setLoading] = useState(false);
  const checkHook = usePuedeGenerarQuestionario();
  const crearHook = useCrearQuestionario();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setCreating((prev: Record<string, boolean>) => ({ ...prev, [moduloId]: true }));

  let checkJson: unknown = null;
      try {
        checkJson = await checkHook.check(moduloId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Si el backend no expone la query, aplicar fallback y continuar
        if (msg.includes('FieldUndefined') && msg.includes('puedeGenerarQuestionario')) {
          checkJson = { canGenerate: true, reason: 'Backend no tiene resolver `puedeGenerarQuestionario` (fallback client-side).' };
        } else {
          throw err;
        }
      }

      const checkObj = (checkJson && typeof checkJson === 'object') ? (checkJson as Record<string, unknown>) : {};
      const maybeCanGenerate = typeof checkObj['canGenerate'] === 'boolean' ? (checkObj['canGenerate'] as boolean) : undefined;
      const maybeMissing = Array.isArray(checkObj['missing']) ? (checkObj['missing'] as unknown[]) : undefined;

      if (!maybeCanGenerate) {
        if (Array.isArray(maybeMissing) && maybeMissing.length > 0) {
          const list = (maybeMissing as string[]).join(', ');
          if (onNotify) onNotify(`Faltan variables de entorno necesarias en el servidor: ${list}`, 'error');
          return;
        }
        const maybeReason = typeof checkObj['reason'] === 'string' ? (checkObj['reason'] as string) : undefined;
        if (onNotify) onNotify(maybeReason || 'No es posible generar el cuestionario para este módulo', 'info');
        return;
      }

      const createJson = await crearHook.crear(moduloId);

      if (Array.isArray(createJson?.missing) && createJson.missing.length > 0) {
        const list = createJson.missing.join(', ');
        if (onNotify) onNotify(`Faltan variables de entorno necesarias en el servidor: ${list}`, 'error');
        return;
      }

  if (onNotify) onNotify('Cuestionario generado correctamente', 'success');
    } catch (err) {
      // Normalizar mensaje de error para la UI
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error generando cuestionario:', message, err);
      if (onNotify) onNotify(message, 'error');
    } finally {
      setLoading(false);
      setCreating(prev => ({ ...prev, [moduloId]: false }));
    }
  };

  return (
    <Button
      variant="contained"
      size="small"
      color="secondary"
      onClick={handleGenerate}
      disabled={loading || !!creating[moduloId]}
      sx={{ textTransform: 'none' }}
    >
      {loading ? 'Generando...' : 'Generar cuestionario'}
    </Button>
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
}: {
  modulo: ModuloWithLecciones;
  expanded: boolean;
  onChange: (e: React.SyntheticEvent, isExpanded: boolean) => void;
  userId?: string | null;
  creating: Record<string, boolean>;
  setCreating: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onNotify?: (msg: string, severity?: 'success' | 'error' | 'info') => void;
}) {
  const { progreso } = useProgresoModulo({ modulo, usuarioId: userId || '' });

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

        {/* Mostrar botón de generar sólo si el progreso es 100% */}
        {true && (
        userId && progreso === 100 && (
            <Box sx={{ ml: 2 }}>
              <ModuloGenerateButton moduloId={modulo.moduloId} creating={creating} setCreating={setCreating} onNotify={onNotify} />
            </Box>
          )
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
                {modulo.Lecciones
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

export default function CourseLessons({ modulos, loading }: CourseLessonsProps) {
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
    <><Box>
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
              onNotify={onNotify} />
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
    </Box><Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar></>
  );
}
