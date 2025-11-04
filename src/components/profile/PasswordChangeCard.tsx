'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { usePasswordChange } from './hooks/usePasswordChange';
import PasswordChangeDialog from './PasswordChangeDialog';

export default function PasswordChangeCard() {
  const [openDialog, setOpenDialog] = useState(false);
  const {
    passwordForm,
    setPasswordForm,
    passwordError,
    passwordSuccess,
    isUpdatingPassword,
    handlePasswordChange,
    reset,
  } = usePasswordChange();

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (!isUpdatingPassword) {
      setOpenDialog(false);
      reset();
    }
  };

  const handleSubmit = async () => {
    const success = await handlePasswordChange();
    if (success) {
      // Auto-close dialog after 2 seconds
      setTimeout(() => {
        setOpenDialog(false);
        reset();
      }, 2000);
    }
  };

  const handlePasswordFormChange = (
    field: 'oldPassword' | 'newPassword' | 'confirmPassword',
    value: string
  ) => {
    setPasswordForm({ ...passwordForm, [field]: value });
  };

  return (
    <>
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
            onClick={handleOpenDialog}
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

      <PasswordChangeDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        passwordForm={passwordForm}
        onPasswordFormChange={handlePasswordFormChange}
        passwordError={passwordError}
        passwordSuccess={passwordSuccess}
        isUpdatingPassword={isUpdatingPassword}
      />
    </>
  );
}

