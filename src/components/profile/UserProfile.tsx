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
  Chip,
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
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Security as SecurityIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useProfile, useActivities, useCourses } from '@/hooks/useUserData';

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
  const [tabValue, setTabValue] = useState(0);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  
  // Usar los hooks para obtener datos
  const { profile, loading, changePassword } = useProfile();
  const { activities } = useActivities();
  const { courses, totalProgress } = useCourses();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePasswordChange = async () => {
    try {
      const result = await changePassword();
      if (result.success) {
        setOpenPasswordDialog(false);
        // Mostrar mensaje de éxito
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header del perfil con información principal */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: 'white',
                color: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {profile.name?.charAt(0) || '?'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'white', mb: 1 }}>
                {profile.name}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 2 }}>
                {profile.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip 
                  label={profile.subscription} 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    fontWeight: 500
                  }} 
                />
                <Chip 
                  label={`Usuario desde: ${new Date(profile.createdAt).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long'
                  })}`} 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    fontWeight: 500
                  }} 
                />
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Editar Perfil
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {courses.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cursos Activos
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {totalProgress}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Progreso Promedio
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {activities.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Actividades Completadas
          </Typography>
        </Paper>
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
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
          }}
        >
          {/* Información Detallada del Usuario */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Información Personal
              </Typography>
              
              <Box sx={{ display: 'grid', gap: 3 }}>
                {/* Datos básicos */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Nombre Completo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {profile.name}
                    </Typography>
                    <Button size="small" startIcon={<EditIcon />}>Editar</Button>
                  </Box>
                  <Divider sx={{ mt: 2 }} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Correo Electrónico
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {profile.email}
                    </Typography>
                    <Button size="small" startIcon={<EditIcon />}>Editar</Button>
                  </Box>
                  <Divider sx={{ mt: 2 }} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Plan de Suscripción
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip 
                      label={profile.subscription} 
                      color={profile.subscription === 'Plan Premium' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                    <Button size="small">Cambiar Plan</Button>
                  </Box>
                  <Divider sx={{ mt: 2 }} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Miembro desde
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(profile.createdAt).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                  <Divider sx={{ mt: 2 }} />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Última actualización
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(profile.updatedAt).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Panel de Seguridad */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Seguridad
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Mantén tu cuenta segura actualizando tu contraseña regularmente.
              </Typography>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<SecurityIcon />}
                onClick={() => setOpenPasswordDialog(true)}
                sx={{ mb: 2 }}
              >
                Cambiar Contraseña
              </Button>

              <Button
                variant="outlined"
                fullWidth
                color="error"
              >
                Eliminar Cuenta
              </Button>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Tab Panel 2: Historial de Actividad */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Historial de Actividades
            </Typography>
            
            <List>
              {activities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.subtitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.date}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={activity.type}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItem>
                  {index < activities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Dialog para cambiar contraseña */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Cambiar Contraseña
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Contraseña Actual"
            type="password"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Nueva Contraseña"
            type="password"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Confirmar Nueva Contraseña"
            type="password"
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
          >
            Actualizar Contraseña
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
