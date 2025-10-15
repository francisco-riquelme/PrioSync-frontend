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
  Login as LoginIcon,
  Email,
  Lock,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useAuth } from './hooks/auth';
import authService from '@/utils/services/auth';
import Link from 'next/link';

// Configuración de validación
const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REQUIRED: true,
  PASSWORD_REQUIRED: true
} as const;

// Mensajes de error
// const ERROR_MESSAGES = {
//   INVALID_EMAIL: 'Por favor ingresa un correo electrónico válido',
//   PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} caracteres`,
//   LOGIN_FAILED: 'Error al iniciar sesión. Verifica tus credenciales.'
// } as const;

export default function LoginForm() {
  const router = useRouter();
  const { login, loginState, clearLoginError } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearLoginError();
    setFieldErrors({ email: false, password: false });

    // Validar email
    if (!email || !authService.validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }

    // Validar contraseña
    if (password.length < VALIDATION_CONFIG.PASSWORD_MIN_LENGTH) {
      setFieldErrors(prev => ({ ...prev, password: true }));
      return;
    }

    const result = await login({ email, password });

    if (result.success && result.isSignedIn) {
      // Login successful, redirect to dashboard
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      setFieldErrors({ email: true, password: true });
    }
  };

  const clearErrors = () => {
    clearLoginError();
    setFieldErrors({ email: false, password: false });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (loginState.error) clearErrors();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (loginState.error) clearErrors();
  };

  if (!mounted) {
    return null;
  }

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
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: 'white',
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LoginIcon fontSize="large" />
                </Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 500,
                    color: '#1976d2',
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
                Iniciar Sesión
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: '#757575',
                  lineHeight: 1.5,
                }}
              >
                Ingresa tus credenciales para continuar
              </Typography>
            </Box>

            {/* Mensajes de estado */}
            {loginState.error && (
              <Alert
                severity="error"
                icon={<Error />}
                sx={{ mb: 2 }}
                onClose={() => clearLoginError()}
              >
                {loginState.error}
              </Alert>
            )}

            {loginState.success && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mb: 2 }}
              >
                ¡Inicio de sesión exitoso! Redirigiendo...
              </Alert>
            )}

            {/* Formulario */}
            <Box component="form" onSubmit={handleLogin} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="tu@email.com"
                disabled={loginState.loading}
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
                disabled={loginState.loading}
                error={fieldErrors.password}
                required
                autoComplete="current-password"
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

              {/* Forgot Password Link */}
              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <MuiLink
                  component={Link}
                  href="/auth/forgot-password"
                  sx={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                    ¿Olvidaste tu contraseña?
                  </MuiLink>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loginState.loading}
                startIcon={loginState.loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#9e9e9e',
                  },
                }}
              >
                {loginState.loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Box>

            {/* Sign up link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                ¿No tienes una cuenta?{' '}
                <MuiLink
                  component={Link}
                  href="/auth/register"
                  sx={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Crear cuenta
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
