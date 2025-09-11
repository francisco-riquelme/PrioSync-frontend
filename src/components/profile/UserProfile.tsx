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
} from '@mui/material';
import {
  Edit as EditIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const activityHistory = [
    {
      title: 'Completado: Gestión de Proyectos',
      subtitle: 'Curso Completo - Proyecto',
      date: '01/09/2025'
    },
    {
      title: 'HTML y CSS',
      subtitle: 'Desarrollo de Software - Módulo',
      date: '28/08/2025'
    },
    {
      title: 'Evaluación Módulo 1',
      subtitle: 'Cálculo Avanzado - Evaluación (100%)',
      date: '25/08/2025'
    },
    {
      title: 'Introducción a Derivadas',
      subtitle: 'Cálculo Avanzado - Módulo',
      date: '23/08/2025'
    }
  ];

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
                    backgroundColor: 'error.main',
                    fontSize: '2rem',
                    mr: 2,
                  }}
                >
                  FR
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Francisco Riquelme
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    francisco.riquelme@duocuc.cl
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

          {/* Suscripción */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Suscripción Actual
              </Typography>
              
              <Chip
                label="Plan Gratuito"
                color="primary"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cambiar Contraseña
              </Typography>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                Actualizar Contraseña
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 4 }}>
              Historial de Actividad
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button variant="outlined" size="small">
                Todas
              </Button>
              <Button variant="text" size="small">
                Tareas
              </Button>
            </Box>

            <List>
              {activityHistory.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {activity.title}
                        </Typography>
                      }
                      secondary={activity.subtitle}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {activity.date}
                    </Typography>
                  </ListItem>
                  {index < activityHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
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