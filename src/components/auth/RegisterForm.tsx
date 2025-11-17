// src/components/auth/RegisterForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';
import {
  PersonAdd,
  Email,
  Lock,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useAuth } from './hooks/auth';
import authService from '@/utils/services/auth';
import Link from 'next/link';
import { ENABLE_REGISTRATION, REGISTRATION_DISABLED_MESSAGE } from '@/config/registration';

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
  const { register, registerState, clearRegisterError } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
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
    setLocalError('');
    clearRegisterError();
    setFieldErrors({ email: false, password: false, confirmPassword: false });

    // Validar email
    if (!email || !authService.validateEmail(email)) {
      setLocalError(ERROR_MESSAGES.INVALID_EMAIL);
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }

    // Validar contraseña
    const passwordValidation = authService.validatePassword(password);
    if (!passwordValidation.isValid) {
      setLocalError(passwordValidation.message || ERROR_MESSAGES.PASSWORD_WEAK);
      setFieldErrors(prev => ({ ...prev, password: true }));
      return;
    }

    // Validar confirmación de contraseña
    if (password !== confirmPassword) {
      setLocalError(ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
      setFieldErrors(prev => ({ ...prev, confirmPassword: true }));
      return;
    }

    // Verificación adicional de seguridad
    if (!ENABLE_REGISTRATION) {
      setLocalError(REGISTRATION_DISABLED_MESSAGE);
      return;
    }

    const result = await register({ email, password });

    if (result.success) {
      // Registration successful, redirect to verification page
      setTimeout(() => {
        router.push('/auth/verification');
      }, 1500);
    } else {
      setFieldErrors({ email: true, password: true, confirmPassword: true });
    }
  };

  const clearErrors = () => {
    setLocalError('');
    clearRegisterError();
    setFieldErrors({ email: false, password: false, confirmPassword: false });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (localError || registerState.error) clearErrors();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (localError || registerState.error) clearErrors();
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (localError || registerState.error) clearErrors();
  };

  if (!mounted) {
    return null;
  }

  // Si el registro está deshabilitado, mostrar mensaje
  if (!ENABLE_REGISTRATION) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          padding: 2,
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Registro Deshabilitado
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                {REGISTRATION_DISABLED_MESSAGE}
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push('/auth/login')}
                sx={{ mt: 2 }}
              >
                Ir a Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  const displayError = localError || registerState.error;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box
              sx={{
                textAlign: 'center',
                mb: 4,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mb: 2,
                  cursor: 'pointer',
                }}
                onClick={() => router.push('/')}
              >
                <Box
                  sx={{
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonAdd fontSize="large" />
                </Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 500,
                    color: 'primary.main',
                  }}
                >
                  PrioSync
                </Typography>
              </Box>
              
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 300,
                  color: '#212121',
                  mb: 1,
                }}
              >
                Crear Nueva Cuenta
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: '#757575',
                  lineHeight: 1.5,
                }}
              >
                Completa el formulario para comenzar
              </Typography>
            </Box>

            {/* Mensajes de estado */}
            {displayError && (
              <Alert
                severity="error"
                icon={<Error />}
                sx={{ mb: 2 }}
                onClose={() => {
                  setLocalError('');
                  clearRegisterError();
                }}
              >
                {displayError}
              </Alert>
            )}

            {registerState.success && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mb: 2 }}
              >
                ¡Cuenta creada exitosamente! Redirigiendo a verificación...
              </Alert>
            )}

            {/* Formulario */}
            <Box component="form" onSubmit={handleSignup} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="tu@email.com"
                disabled={registerState.loading}
                error={fieldErrors.email}
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                    '&:hover': {
                      backgroundColor: '#ffffff',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                disabled={registerState.loading}
                error={fieldErrors.password}
                required
                autoComplete="new-password"
                helperText="La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un símbolo (!@#$%^&*)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                    '&:hover': {
                      backgroundColor: '#ffffff',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="••••••••"
                disabled={registerState.loading}
                error={fieldErrors.confirmPassword}
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                    '&:hover': {
                      backgroundColor: '#ffffff',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={registerState.loading}
                startIcon={registerState.loading ? <CircularProgress size={20} /> : <PersonAdd />}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.dark} 100%)`,
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) =>
                      `0 4px 12px ${theme.palette.primary.main}40`,
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#9e9e9e',
                  },
                }}
              >
                {registerState.loading ? 'Creando Cuenta...' : 'Crear Cuenta'}
              </Button>
            </Box>

            {/* Login link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes una cuenta?{' '}
                <MuiLink
                  component={Link}
                  href="/auth/login"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                    Iniciar sesión
                  </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}