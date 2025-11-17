'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useCursosConProgreso } from '@/hooks/useCursosConProgreso';
import { useActividadUsuario } from '@/hooks/useActividadUsuario';
import { useCalendarData } from '@/hooks/useCalendarData';
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
import { Person as PersonIcon, CloudUpload as CloudUploadIcon, School as SchoolIcon, EmojiEvents as TrophyIcon, Close as CloseIcon, WorkspacePremium as PlatinumIcon, CheckCircle as CheckCircleIcon, CalendarToday as CalendarTodayIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import ImportCourseModal from './ImportCourseModal';
import { getActividadIcon } from '@/components/profile/profileUtils';
import { formatearFechaAbsoluta } from '@/utils/dateHelpers';

export default function Dashboard() {
  const router = useRouter();
  const { userData, loading, refreshUser } = useUser();
  const { cursos, loading: cursosLoading, error: cursosError, recargar } = useCursosConProgreso();
  const { actividades, loading: actividadesLoading, error: actividadesError } = useActividadUsuario();
  const { sessions: sesionesProgramadas } = useCalendarData(userData?.usuarioId);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isWaitingForWorkflow, setIsWaitingForWorkflow] = useState(false);
  
  // Obtener cursos activos con progreso, ordenados de mayor a menor progreso, luego alfabéticamente, limitado a 5
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
    
    // Ordenar: primero por progreso (mayor a menor), luego alfabéticamente por título
    const cursosOrdenados = cursosConProgreso.sort((a, b) => {
      if (b.progreso !== a.progreso) {
        return b.progreso - a.progreso;
      }
      return a.titulo.localeCompare(b.titulo);
    });
    
    // Limitar a máximo 5 cursos
    return cursosOrdenados.slice(0, 5);
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

  // Calcular estadísticas del día
  const estadisticasDia = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finDia = new Date(hoy);
    finDia.setHours(23, 59, 59, 999);

    // Filtrar actividades de hoy
    const actividadesHoy = actividades?.filter(actividad => {
      const fecha = new Date(actividad.fecha);
      return fecha >= hoy && fecha <= finDia;
    }) || [];

    // Sesiones completadas hoy
    const sesionesHoy = actividadesHoy.filter(a => a.tipo === 'sesion');
    const sesionesCompletadas = sesionesHoy.length;

    // Lecciones completadas hoy
    const leccionesHoy = actividadesHoy.filter(a => a.tipo === 'leccion');
    const leccionesVistas = leccionesHoy.length;

    // Progreso promedio de cursos
    const progresoPromedio = cursosActivosConProgreso.length > 0
      ? Math.round(cursosActivosConProgreso.reduce((sum, curso) => sum + curso.progreso, 0) / cursosActivosConProgreso.length)
      : 0;

    return {
      sesionesCompletadas,
      leccionesVistas,
      progresoPromedio,
      haEstudiadoHoy: sesionesCompletadas > 0 || leccionesVistas > 0,
    };
  }, [actividades, cursosActivosConProgreso]);

  // Encontrar próxima sesión programada
  const proximaSesion = useMemo(() => {
    if (!sesionesProgramadas || sesionesProgramadas.length === 0) return null;

    const ahora = new Date();
    const sesionesFuturas = sesionesProgramadas
      .filter(sesion => {
        const fechaHora = new Date(`${sesion.fecha}T${sesion.hora_inicio}`);
        return fechaHora > ahora;
      })
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora_inicio}`);
        const fechaB = new Date(`${b.fecha}T${b.hora_inicio}`);
        return fechaA.getTime() - fechaB.getTime();
      });

    return sesionesFuturas.length > 0 ? sesionesFuturas[0] : null;
  }, [sesionesProgramadas]);

  // Generar mensaje motivacional
  const mensajeMotivacional = useMemo(() => {
    if (estadisticasDia.haEstudiadoHoy) {
      if (estadisticasDia.sesionesCompletadas >= 2) {
        return "¡Excelente trabajo hoy! Sigue así.";
      }
      return "¡Bien hecho! Has comenzado tu día de estudio.";
    } else {
      const hora = new Date().getHours();
      if (hora < 12) {
        return "¡Buenos días! Es un gran momento para comenzar a estudiar.";
      } else if (hora < 18) {
        return "¡Buenas tardes! Aprovecha el día para avanzar en tus cursos.";
      } else {
        return "¡Buenas noches! Nunca es tarde para aprender algo nuevo.";
      }
    }
  }, [estadisticasDia]);
  
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

  const navigateToProfileWithTab = (tabIndex: number) => {
    router.push(`/profile?tab=${tabIndex}`);
  };

  const navigateToCourses = () => {
    router.push('/courses');
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
        <Card sx={{ p: 1.5, backgroundColor: 'background.default' }}>
          <CardContent sx={{ p: '16px !important', '&:last-child': { pb: '16px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 0.5 }}>
                  {greeting}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ 
                    color: 'text.secondary',
                    mb: 1.5,
                    fontSize: '0.85rem',
                  }}
                >
                  {mensajeMotivacional}
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

            {/* Estadísticas rápidas */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
              <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, backgroundColor: 'action.hover' }}>
                <CheckCircleIcon sx={{ fontSize: 20, color: 'success.main', mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
                  {estadisticasDia.sesionesCompletadas}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Sesiones hoy
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, backgroundColor: 'action.hover' }}>
                <SchoolIcon sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
                  {estadisticasDia.leccionesVistas}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Lecciones completadas hoy
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1, backgroundColor: 'action.hover' }}>
                <TrendingUpIcon sx={{ fontSize: 20, color: 'info.main', mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
                  {estadisticasDia.progresoPromedio}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Progreso promedio
                </Typography>
              </Box>
            </Box>

            {/* Próxima sesión programada */}
            {proximaSesion && (() => {
              // Crear título basado en las asociaciones de la sesión
              let tituloSesion = 'Sesión de estudio';
              if (proximaSesion.leccionId) {
                tituloSesion = 'Lección';
              } else if (proximaSesion.cursoId) {
                tituloSesion = 'Curso';
              }
              
              return (
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 1, 
                  backgroundColor: 'primary.50', 
                  border: '1px solid',
                  borderColor: 'primary.200',
                  mb: 1.5,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
                      Próxima sesión
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', mb: 0.5 }}>
                    {tituloSesion}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {formatearFechaAbsoluta(new Date(`${proximaSesion.fecha}T${proximaSesion.hora_inicio}`))} • {proximaSesion.hora_inicio}
                  </Typography>
                </Box>
              );
            })()}
          </CardContent>
        </Card>

        {/* Progreso de Cursos (fusionado con Cursos Activos) */}
        <Card sx={{ height: '450px', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, minHeight: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
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
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto',
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
              },
            }}>
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
                      mb: 1,
                      p: 0.75,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => navigateToCourse(curso.cursoId)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: 'primary.main',
                          mr: 1,
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.2 }}>
                            {curso.titulo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            {curso.progreso}%
                          </Typography>
                        </Box>
                        {curso.nivel_dificultad && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontSize: '0.65rem' }}>
                            {curso.nivel_dificultad.charAt(0).toUpperCase() + curso.nivel_dificultad.slice(1)}
                          </Typography>
                        )}
                        <LinearProgress
                          variant="determinate"
                          value={curso.progreso}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 2,
                              backgroundColor: 'success.main',
                            },
                          }}
                        />
                      </Box>
                    </Box>
                    {index < cursosActivosConProgreso.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))
              )}
            </Box>
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={navigateToCourses}
                sx={{ textTransform: 'none', py: 0.75 }}
              >
                Ver Cursos
              </Button>
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
        {/* Historial de Actividades */}
        <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, minHeight: 0 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Historial de Actividades
            </Typography>
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto',
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
              },
            }}>
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
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
                          <Box sx={{ fontSize: '1.25rem' }}>
                            {getActividadIcon(actividad.tipo)}
                          </Box>
                        </Box>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.2, mb: 0.25 }}>
                              {actividad.titulo}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {actividad.subtitulo}
                            </Typography>
                          }
                          sx={{ my: 0 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 90, textAlign: 'right', fontSize: '0.7rem' }}
                        >
                          {formatearFechaAbsoluta(actividad.fecha)}
                        </Typography>
                      </ListItem>
                      {index < actividadesRecientes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => navigateToProfileWithTab(1)}
                sx={{ textTransform: 'none' }}
              >
                Ver Actividades
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Puntaje Acumulado */}
        <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, minHeight: 0 }}>
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
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto',
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
              },
            }}>
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
                          gap: 1.5,
                          py: 1.25,
                          px: 0.75,
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
                            minWidth: 32,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: badgeInfo.bg,
                            color: badgeInfo.color,
                            flexShrink: 0,
                          }}
                        >
                          <BadgeIcon sx={{ fontSize: Math.min(badgeInfo.size, 18) }} />
                        </Box>
                        
                        {/* Contenido principal */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              mb: 0.25,
                              color: 'text.primary',
                              fontSize: '0.8rem',
                              lineHeight: 1.2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {tituloLimpio}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              {quiz.cursoNombre || 'Sin curso'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              •
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem' }}
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
                            minWidth: 50,
                            flexShrink: 0,
                          }}
                        >
                          <Chip
                            label={puntajeReal}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: 24,
                              backgroundColor: aprobado ? 'success.main' : 'error.main',
                              color: 'white',
                              '& .MuiChip-label': {
                                px: 1,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                      {index < ultimosCuestionarios.length - 1 && (
                        <Divider sx={{ mx: 0.5 }} />
                      )}
                    </Box>
                  );
                })}
                </Box>
              )}
            </Box>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => navigateToProfileWithTab(2)}
                sx={{ textTransform: 'none' }}
              >
                Ver Logros
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>  
  );
}
