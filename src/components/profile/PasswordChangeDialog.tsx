'use client';

import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

interface PasswordChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  passwordForm: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  onPasswordFormChange: (field: 'oldPassword' | 'newPassword' | 'confirmPassword', value: string) => void;
  passwordError: string | null;
  passwordSuccess: boolean;
  isUpdatingPassword: boolean;
}

export default function PasswordChangeDialog({
  open,
  onClose,
  onSubmit,
  passwordForm,
  onPasswordFormChange,
  passwordError,
  passwordSuccess,
  isUpdatingPassword,
}: PasswordChangeDialogProps) {
  const handleOldPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordFormChange('oldPassword', e.target.value);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordFormChange('newPassword', e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordFormChange('confirmPassword', e.target.value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          Cambiar Contraseña
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Contraseña actualizada correctamente
            </Alert>
          )}
          <TextField
            fullWidth
            label="Contraseña Actual"
            type="password"
            variant="outlined"
            value={passwordForm.oldPassword}
            onChange={handleOldPasswordChange}
            disabled={isUpdatingPassword}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Nueva Contraseña"
            type="password"
            variant="outlined"
            value={passwordForm.newPassword}
            onChange={handleNewPasswordChange}
            disabled={isUpdatingPassword}
            helperText="Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirmar Nueva Contraseña"
            type="password"
            variant="outlined"
            value={passwordForm.confirmPassword}
            onChange={handleConfirmPasswordChange}
            disabled={isUpdatingPassword}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isUpdatingPassword}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isUpdatingPassword}
          startIcon={isUpdatingPassword ? <CircularProgress size={16} /> : undefined}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {isUpdatingPassword ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

