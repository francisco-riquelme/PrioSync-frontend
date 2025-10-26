'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Quiz as QuizIcon,
  Book as BookIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useUser } from '@/contexts/UserContext';
import { useActividadUsuario } from '@/hooks/useActividadUsuario';
import { useCursosConProgreso } from '@/hooks/useCursosConProgreso';
import { formatearFechaAbsoluta } from '@/utils/dateHelpers';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserProfile() {
  const { userData, loading } = useUser();
  const { actividadesPorCurso, actividadesSinCurso, loading: loadingActividades, error: errorActividades } = useActividadUsuario();
  const { cursos: cursosConProgreso } = useCursosConProgreso();
  const [tabValue, setTabValue] = useState(0);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Helper function to get user initials
  const getUserInitials = (nombre: string, apellido?: string | null) => {
    const firstInitial = nombre ? nombre.charAt(0).toUpperCase() : '';
    const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Helper function to get full name
  const getFullName = (nombre: string, apellido?: string | null) => {
    return apellido ? `${nombre} ${apellido}` : nombre;
  };

  // Función para obtener el icono según el tipo de actividad
  const getActividadIcon = (tipo: string) => {
    switch (tipo) {
      case 'leccion':
        return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'quiz':
        return <QuizIcon sx={{ color: 'primary.main', fontSize: 20 }} />;
      case 'sesion':
        return <BookIcon sx={{ color: 'secondary.main', fontSize: 20 }} />;
      case 'curso-completado':
        return <SchoolIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
      default:
        return <CheckCircleIcon sx={{ color: 'text.secondary', fontSize: 20 }} />;
    }
  };

  // Función para obtener el progreso de un curso específico
  const getProgresoCurso = (cursoId: string): number => {
    const curso = cursosConProgreso.find(c => c.cursoId === cursoId);
    return curso?.progreso || 0;
  };

  return (
    <Box>
      {/* Header del perfil */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          Mi Perfil
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Información Personal" />
          <Tab label="Historial de Actividad" />
        </Tabs>
      </Box>

      {/* Tab Panel 1: Información Personal */}
      <TabPanel value={tabValue} index={0}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* Información del Usuario */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Información Personal
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: 'primary.main',
                    fontSize: '2rem',
                    mr: 2,
                  }}
                >
                  {userData ? getUserInitials(userData.nombre, userData.apellido) : 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {userData ? getFullName(userData.nombre, userData.apellido) : 'Usuario'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userData?.email || 'No disponible'}
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    size="small"
                    sx={{ mt: 1, textTransform: 'none' }}
                  >
                    Editar Información
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Cambiar Contraseña
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Contraseña Actual
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Nueva Contraseña
              </Typography>
              
              <Button
                variant="contained"
                fullWidth
                onClick={() => setOpenPasswordDialog(true)}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                Actualizar Contraseña
              </Button>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Tab Panel 2: Historial de Actividad */}
      <TabPanel value={tabValue} index={1}>
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
                    <Accordion key={curso.cursoId} defaultExpanded={false} sx={{ mb: 1 }}>
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
                                label={`${curso.actividades.length} ${curso.actividades.length === 1 ? 'actividad' : 'actividades'}`}
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
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {actividad.titulo}
                                    </Typography>
                                  }
                                  secondary={actividad.subtitulo}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, textAlign: 'right' }}>
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
                            label={`${actividadesSinCurso.length} ${actividadesSinCurso.length === 1 ? 'actividad' : 'actividades'}`}
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
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {actividad.titulo}
                                  </Typography>
                                }
                                secondary={actividad.subtitulo}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120, textAlign: 'right' }}>
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
      </TabPanel>

      {/* Dialog para cambiar contraseña */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Cambiar Contraseña
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Contraseña Actual"
              type="password"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Nueva Contraseña"
              type="password"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirmar Nueva Contraseña"
              type="password"
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenPasswordDialog(false)}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}