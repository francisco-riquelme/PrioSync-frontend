'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Avatar, Button } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { getUserInitials, getFullName } from './profileUtils';
import EditInformationDialog from './EditInformationDialog';

interface ProfileHeaderProps {
  userData: {
    nombre: string;
    apellido?: string | null;
    email?: string | null;
  } | null;
  onUpdateUser?: (data: { nombre: string; apellido: string }) => Promise<boolean>;
}

export default function ProfileHeader({ userData, onUpdateUser }: ProfileHeaderProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (data: { nombre: string; apellido: string }) => {
    if (onUpdateUser) {
      setIsSaving(true);
      try {
        const success = await onUpdateUser(data);
        return success;
      } finally {
        setIsSaving(false);
      }
    }
    return false;
  };

  return (
    <>
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
                onClick={handleEditClick}
                sx={{ mt: 1, textTransform: 'none' }}
              >
                Editar Información
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <EditInformationDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={{
          nombre: userData?.nombre || '',
          apellido: userData?.apellido || null,
        }}
        isSaving={isSaving}
      />
    </>
  );
}

