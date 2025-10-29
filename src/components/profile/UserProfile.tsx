'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab, CircularProgress, Typography } from '@mui/material';
import { useUser } from '@/contexts/UserContext';
import ProfileHeader from './ProfileHeader';
import PasswordChangeCard from './PasswordChangeCard';
import ActivityHistory from './ActivityHistory';

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
  const { userData, loading, updateUser } = useUser();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateUser = async (data: { nombre: string; apellido: string }) => {
    try {
      await updateUser({ nombre: data.nombre, apellido: data.apellido });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
          <ProfileHeader userData={userData} onUpdateUser={handleUpdateUser} />

          {/* Cambiar Contraseña */}
          <PasswordChangeCard />
        </Box>
      </TabPanel>

      {/* Tab Panel 2: Historial de Actividad */}
      <TabPanel value={tabValue} index={1}>
        <ActivityHistory />
      </TabPanel>
    </Box>
  );
}
