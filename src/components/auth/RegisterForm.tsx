// src/components/auth/RegisterForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import authService from '@/utils/services/auth';

// Configuración de validación
const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REQUIRED: true,
  PASSWORD_REQUIRED: true
} as const;

// Mensajes de error
const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Por favor ingresa un correo electrónico válido',
  PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} caracteres`,
  PASSWORD_WEAK: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  REGISTRATION_FAILED: 'Error al crear la cuenta. Inténtalo de nuevo.'
} as const;

export default function RegisterForm() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFieldErrors({ email: false, password: false, confirmPassword: false });

    // Validar email
    if (!email || !authService.validateEmail(email)) {
      setError(ERROR_MESSAGES.INVALID_EMAIL);
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }

    // Validar contraseña
    const passwordValidation = authService.validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || ERROR_MESSAGES.PASSWORD_WEAK);
      setFieldErrors(prev => ({ ...prev, password: true }));
      return;
    }

    // Validar confirmación de contraseña
    if (password !== confirmPassword) {
      setError(ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
      setFieldErrors(prev => ({ ...prev, confirmPassword: true }));
      return;
    }

    setLoading(true);

    try {
      const result = await authService.signUp({
        email,
        password,
      });

      if (result.success) {
        // Registration successful, redirect to verification page
        router.push('/auth/verification');
      } else {
        setError(result.error || ERROR_MESSAGES.REGISTRATION_FAILED);
        setFieldErrors({ email: true, password: true, confirmPassword: true });
      }
    } catch (error) {
      console.error(error);
      setError(ERROR_MESSAGES.REGISTRATION_FAILED);
      setFieldErrors({ email: true, password: true, confirmPassword: true });
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = () => {
    setError('');
    setFieldErrors({ email: false, password: false, confirmPassword: false });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) clearErrors();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) clearErrors();
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (error) clearErrors();
  };

  if (!mounted) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#e3edfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, width: 380, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={700} color="#3b82f6" gutterBottom>
            PrioSync
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Crear nueva cuenta
          </Typography>
        </Box>
        <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            fullWidth
            size="small"
            autoComplete="email"
            error={fieldErrors.email}
            disabled={loading}
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
            error={fieldErrors.password}
            disabled={loading}
            helperText="Mínimo 8 caracteres, con mayúscula, minúscula y número"
          />
          <TextField
            label="Confirmar Contraseña"
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            fullWidth
            size="small"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
            sx={{
              textTransform: 'none',
              bgcolor: '#3b82f6',
              fontWeight: 600,
              borderRadius: 2,
              py: 1.2,
              fontSize: 16,
              boxShadow: 1,
              '&:hover': { bgcolor: '#2563eb' },
              '&:disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e',
              },
            }}
            fullWidth
          >
            {loading ? 'Creando Cuenta...' : 'Crear Cuenta'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}