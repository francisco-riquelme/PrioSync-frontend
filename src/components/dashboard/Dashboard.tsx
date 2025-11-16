'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useCursosConProgreso } from '@/hooks/useCursosConProgreso';
import { useActividadUsuario } from '@/hooks/useActividadUsuario';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Person as PersonIcon, CloudUpload as CloudUploadIcon, School as SchoolIcon, EmojiEvents as TrophyIcon, Close as CloseIcon, WorkspacePremium as PlatinumIcon } from '@mui/icons-material';
import ImportCourseModal from './ImportCourseModal';
import { getActividadIcon } from '@/components/profile/profileUtils';
import { formatearFechaAbsoluta } from '@/utils/dateHelpers';

export default function Dashboard() {
  const router = useRouter();
  const { userData, loading, refreshUser } = useUser();
  const { cursos, loading: cursosLoading, error: cursosError, recargar } = useCursosConProgreso();
  const { actividades, loading: actividadesLoading, error: actividadesError } = useActividadUsuario();
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isWaitingForWorkflow, setIsWaitingForWorkflow] = useState(false);
  
  // Obtener cursos activos con progreso, ordenados de mayor a menor progreso
  const cursosActivosConProgreso = useMemo(() => {
    if (!userData?.Cursos || !cursos) return [];
    
    // Filtrar cursos activos
    const cursosActivos = userData.Cursos.filter(curso => curso.estado === 'activo');
    
    // Combinar con datos de progreso
    const cursosConProgreso = cursosActivos.map(curso => {
      const progresoData = cursos.find(c => c.cursoId === curso.cursoId);
      return {
        ...curso,
        progreso: progresoData?.progreso || 0,
      };
    });
    
    // Ordenar de mayor a menor progreso
    return cursosConProgreso.sort((a, b) => b.progreso - a.progreso);
  }, [userData?.Cursos, cursos]);

  // Obtener las 5 actividades más recientes
  const actividadesRecientes = useMemo(() => {
    if (!actividades || actividades.length === 0) return [];
    return actividades.slice(0, 5);
  }, [actividades]);

  // Obtener los últimos 5 cuestionarios y calcular puntaje acumulado
  const { ultimosCuestionarios, puntajeAcumulado } = useMemo(() => {
    if (!actividades || actividades.length === 0) {
      return { ultimosCuestionarios: [], puntajeAcumulado: 0 };
    }

    // Filtrar solo cuestionarios
    const cuestionarios = actividades
      .filter(actividad => actividad.tipo === 'quiz')
      .slice(0, 5); // Últimos 5

    // Calcular puntaje acumulado (suma de todos los puntajes de cuestionarios)
    const todosLosCuestionarios = actividades.filter(actividad => actividad.tipo === 'quiz');
    const puntajeTotal = todosLosCuestionarios.reduce((sum, quiz) => {
      return sum + (quiz.metadata?.puntaje || 0);
    }, 0);

    return {
      ultimosCuestionarios: cuestionarios,
      puntajeAcumulado: puntajeTotal,
    };
  }, [actividades]);
  
  // Guard: loading/auth
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayName = userData?.nombre || 'Usuario';

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToCourse = (cursoId: string) => {
    router.push(`/courses/${cursoId}`);
  };

  const handleImportSuccess = async () => {
    // Refresh user data to get the new course
    await refreshUser();
    // Refresh course progress
    await recargar();
  };


  // Prepare user data
  const greeting = `¡Hola, ${displayName}!`;

  return (
    <Box>
      {/* Import Modal */}
      <ImportCourseModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        userId={userData?.usuarioId || ''}
        onSuccess={handleImportSuccess}
        onWorkflowStatusChange={setIsWaitingForWorkflow}
      />

      {/* Global blocking modal for workflow processing */}
      <Dialog
        open={isWaitingForWorkflow}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            boxShadow: 24,
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          },
        }}
      >
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              px: 2,
            }}
          >
            <CircularProgress size={56} sx={{ mb: 3 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Procesando Curso
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 1 }}>
              Estamos procesando tu curso y creando el contenido educativo.
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Esto puede tomar varios minutos. Por favor, no cierres esta ventana.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Primera fila */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Saludo personalizado */}
        <Card sx={{ p: 2, backgroundColor: 'background.default' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {greeting}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ 
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    mb: 2 
                  }}
                >
                  &ldquo;Con cada esfuerzo, forjas tu destino.&rdquo;
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonIcon />}
                onClick={navigateToProfile}
                sx={{ ml: 2 }}
              >
                Ver Perfil
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: 'primary.main',
                  fontSize: '0.75rem',
                }}
              >
                IA
              </Avatar>
              <Chip
                label="Generado con IA"
                size="small"
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Progreso de Cursos (fusionado con Cursos Activos) */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Progreso de Cursos
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${cursosActivosConProgreso.length} ${cursosActivosConProgreso.length === 1 ? 'curso' : 'cursos'}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setImportModalOpen(true)}
                >
                  Importar Curso
                </Button>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              {cursosLoading || loading || !userData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : cursosError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {cursosError}
                </Alert>
              ) : cursosActivosConProgreso.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tienes cursos activos actualmente.
                </Typography>
              ) : (
                cursosActivosConProgreso.map((curso, index) => (
                  <Box
                    key={curso.cursoId}
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => navigateToCourse(curso.cursoId)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'primary.main',
                          mr: 2,
                        }}
                      >
                        <SchoolIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {curso.titulo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {curso.progreso}%
                          </Typography>
                        </Box>
                        {curso.nivel_dificultad && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {curso.nivel_dificultad.charAt(0).toUpperCase() + curso.nivel_dificultad.slice(1)}
                          </Typography>
                        )}
                        <LinearProgress
                          variant="determinate"
                          value={curso.progreso}
                          sx={{
                            height: 8,
                            borderRadius: 3,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: 'success.main',
                            },
                          }}
                        />
                      </Box>
                    </Box>
                    {index < cursosActivosConProgreso.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Segunda fila */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Puntaje Acumulado */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Puntaje Acumulado
              </Typography>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'warning.main',
                }}
              >
                <TrophyIcon sx={{ fontSize: 28 }} />
              </Avatar>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                {puntajeAcumulado}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Puntos totales obtenidos
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Últimos 5 Cuestionarios
            </Typography>
            {actividadesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : actividadesError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {actividadesError}
              </Alert>
            ) : ultimosCuestionarios.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No has completado cuestionarios todavía.
              </Typography>
            ) : (
              <Box sx={{ pt: 0 }}>
                {ultimosCuestionarios.map((quiz, index) => {
                  // Extraer tipo de cuestionario del título
                  const tipoMatch = quiz.titulo.match(/^(EVALUACION|PRACTICA|autoevaluacion):/i);
                  const tipoQuiz = tipoMatch ? tipoMatch[1].toLowerCase() : 'evaluacion';
                  
                  // Limpiar el título del cuestionario
                  const tituloLimpio = quiz.titulo
                    .replace(/^(EVALUACION|PRACTICA|autoevaluacion):\s*/i, '')
                    .replace(/^Cuestionario:\s*/i, '')
                    .trim();
                  
                  const porcentaje = quiz.metadata?.puntaje || 0;
                  const aprobado = quiz.metadata?.aprobado ?? false;
                  
                  // Obtener puntaje real y puntos máximos desde metadata (si están disponibles)
                  // Si no están disponibles, calcular desde el porcentaje
                  let puntajeReal = quiz.metadata?.puntajeReal;
                  let puntosMaximos = quiz.metadata?.puntosMaximos;
                  
                  // Determinar si es Autoevaluación (PRACTICA/autoevaluacion) o Prueba Final (EVALUACION)
                  const esAutoevaluacion = tipoQuiz === 'practica' || tipoQuiz === 'autoevaluacion';
                  
                  // Si no tenemos el puntaje real, calcularlo desde el porcentaje
                  if (puntajeReal === undefined || puntosMaximos === undefined) {
                    // Calcular puntaje real según el tipo
                    // Autoevaluación: 0-10 puntos, Prueba Final: 0-20 puntos
                    puntosMaximos = esAutoevaluacion ? 10 : 20;
                    puntajeReal = Math.round((porcentaje / 100) * puntosMaximos);
                  } else {
                    // Usar el puntaje real directamente
                    puntajeReal = Math.round(puntajeReal);
                  }
                  
                  // Función para determinar emblema/trofeo según tipo y puntaje
                  const getBadgeInfo = (score: number, isAutoevaluacion: boolean) => {
                    if (score === 0) {
                      return {
                        icon: CloseIcon,
                        bg: 'error.light',
                        color: 'error.main',
                        size: 20,
                      };
                    }
                    
                    if (isAutoevaluacion) {
                      // Autoevaluación: 0-10 puntos
                      if (score === 10) {
                        return {
                          icon: PlatinumIcon,
                          bg: '#E5E4E2', // Platino
                          color: '#8B8B8B',
                          size: 20,
                        };
                      } else if (score >= 7 && score <= 9) {
                        return {
                          icon: TrophyIcon,
                          bg: '#FFD700', // Oro
                          color: '#B8860B',
                          size: 20,
                        };
                      } else if (score >= 4 && score <= 6) {
                        return {
                          icon: TrophyIcon,
                          bg: '#C0C0C0', // Plata
                          color: '#808080',
                          size: 20,
                        };
                      } else if (score >= 1 && score <= 3) {
                        return {
                          icon: TrophyIcon,
                          bg: '#CD7F32', // Bronce
                          color: '#8B4513',
                          size: 20,
                        };
                      }
                    } else {
                      // Prueba Final: 0-20 puntos
                      if (score === 20) {
                        return {
                          icon: PlatinumIcon,
                          bg: '#E5E4E2', // Platino
                          color: '#8B8B8B',
                          size: 24, // Más grande
                        };
                      } else if (score === 19) {
                        return {
                          icon: PlatinumIcon,
                          bg: '#E5E4E2', // Platino
                          color: '#8B8B8B',
                          size: 20,
                        };
                      } else if (score >= 13 && score <= 18) {
                        return {
                          icon: TrophyIcon,
                          bg: '#FFD700', // Oro
                          color: '#B8860B',
                          size: 20,
                        };
                      } else if (score >= 7 && score <= 12) {
                        return {
                          icon: TrophyIcon,
                          bg: '#C0C0C0', // Plata
                          color: '#808080',
                          size: 20,
                        };
                      } else if (score >= 1 && score <= 6) {
                        return {
                          icon: TrophyIcon,
                          bg: '#CD7F32', // Bronce
                          color: '#8B4513',
                          size: 20,
                        };
                      }
                    }
                    
                    // Fallback
                    return {
                      icon: CloseIcon,
                      bg: 'error.light',
                      color: 'error.main',
                      size: 20,
                    };
                  };
                  
                  const badgeInfo = getBadgeInfo(puntajeReal, esAutoevaluacion);
                  const BadgeIcon = badgeInfo.icon;
                  
                  return (
                    <Box key={quiz.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          py: 2,
                          px: 1,
                          borderRadius: 1,
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        {/* Icono de Emblema/Trofeo */}
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
                            flexShrink: 0,
                          }}
                        >
                          <BadgeIcon sx={{ fontSize: badgeInfo.size }} />
                        </Box>
                        
                        {/* Contenido principal */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              mb: 0.5,
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {tituloLimpio}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.75rem' }}
                            >
                              {quiz.cursoNombre || 'Sin curso'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.75rem' }}
                            >
                              •
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.75rem' }}
                            >
                              {formatearFechaAbsoluta(quiz.fecha)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Puntaje */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 60,
                            flexShrink: 0,
                          }}
                        >
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
                        </Box>
                      </Box>
                      {index < ultimosCuestionarios.length - 1 && (
                        <Divider sx={{ mx: 1 }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Historial de Actividades */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Historial de Actividades
            </Typography>
            {actividadesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : actividadesError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {actividadesError}
              </Alert>
            ) : actividadesRecientes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No hay actividades registradas todavía.
              </Typography>
            ) : (
              <List sx={{ pt: 0 }}>
                {actividadesRecientes.map((actividad, index) => (
                  <React.Fragment key={actividad.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {getActividadIcon(actividad.tipo)}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {actividad.titulo}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {actividad.subtitulo}
                          </Typography>
                        }
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ minWidth: 100, textAlign: 'right', fontSize: '0.7rem' }}
                      >
                        {formatearFechaAbsoluta(actividad.fecha)}
                      </Typography>
                    </ListItem>
                    {index < actividadesRecientes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>  
  );
}
