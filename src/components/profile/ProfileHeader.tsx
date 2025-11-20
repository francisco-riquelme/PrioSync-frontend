'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Button, 
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { getUserInitials, getFullName } from './profileUtils';
import EditInformationDialog from './EditInformationDialog';
import {
  loadPhotoFromLocalStorage,
  savePhotoToLocalStorage,
  getDetailedValidationErrorMessage,
} from '@/utils/profilePhotoUtils';

interface ProfileHeaderProps {
  userData: {
    nombre: string;
    apellido?: string | null;
    email?: string | null;
    usuarioId?: string;
  } | null;
  onUpdateUser?: (data: { nombre: string; apellido: string }) => Promise<boolean>;
}

export default function ProfileHeader({ userData, onUpdateUser }: ProfileHeaderProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar foto de perfil al montar el componente
  useEffect(() => {
    if (userData?.usuarioId) {
      const photo = loadPhotoFromLocalStorage(userData.usuarioId);
      setProfilePhoto(photo);
    }
  }, [userData?.usuarioId]);

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

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userData?.usuarioId) {
      return;
    }

    // Validar archivo y obtener mensaje de error detallado
    const validationError = getDetailedValidationErrorMessage(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Leer el archivo como data URL
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        
        // Guardar en localStorage
        savePhotoToLocalStorage(userData.usuarioId!, dataUrl);
        
        // Actualizar el estado para mostrar la imagen
        setProfilePhoto(dataUrl);
        setIsUploading(false);
      };

      reader.onerror = () => {
        setErrorMessage('Error al leer el archivo. Por favor, intenta de nuevo.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setErrorMessage('Error al cargar la foto. Por favor, intenta de nuevo.');
      setIsUploading(false);
    }

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Información Personal
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', mr: 2 }}>
              <Avatar
                src={profilePhoto || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: profilePhoto ? 'transparent' : 'primary.main',
                  fontSize: '2rem',
                  border: profilePhoto ? '2px solid' : 'none',
                  borderColor: profilePhoto ? 'divider' : 'transparent',
                }}
              >
                {!profilePhoto && userData ? getUserInitials(userData.nombre, userData.apellido) : 'U'}
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <IconButton
                color="primary"
                aria-label="cargar foto de perfil"
                onClick={handlePhotoClick}
                disabled={isUploading || !userData?.usuarioId}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {isUploading ? (
                  <CircularProgress size={20} />
                ) : (
                  <PhotoCameraIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
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

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

