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
  Stepper,
  Step,
  StepLabel,
  Link as MuiLink,
} from '@mui/material';
import {
  LockReset,
  Email,
  Security,
  Lock,
  CheckCircle,
  Error,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from './hooks/auth';
import authService from '@/utils/services/auth';
import Link from 'next/link';


// Mensajes de error
// const ERROR_MESSAGES = {
//   INVALID_EMAIL: 'Por favor ingresa un correo electrónico válido',
//   PASSWORD_WEAK: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
//   PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
//   RESET_FAILED: 'Error al restablecer la contraseña. Inténtalo de nuevo.'
// } as const;

const steps = ['Solicitar código', 'Restablecer contraseña'];

export default function ForgotPasswordForm() {
  const router = useRouter();
  const {
    requestPasswordReset,
    confirmPasswordReset,
    resetPasswordState,
    confirmPasswordResetState,
    clearResetPasswordError,
    clearConfirmPasswordResetError,
  } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    code: false,
    newPassword: false,
    confirmPassword: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearResetPasswordError();
    setFieldErrors({ email: false, code: false, newPassword: false, confirmPassword: false });

    // Validar email
    if (!email || !authService.validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }

    const result = await requestPasswordReset({ email });

    if (result.success) {
      setActiveStep(1);
    } else {
      setFieldErrors(prev => ({ ...prev, email: true }));
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearConfirmPasswordResetError();
    setFieldErrors({ email: false, code: false, newPassword: false, confirmPassword: false });

    // Validar código
    if (!authService.validateConfirmationCode(code)) {
      setFieldErrors(prev => ({ ...prev, code: true }));
      return;
    }

    // Validar nueva contraseña
    const passwordValidation = authService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, newPassword: true }));
      return;
    }

    // Validar confirmación de contraseña
    if (newPassword !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: true }));
      return;
    }

    const result = await confirmPasswordReset({
      email,
      confirmationCode: code,
      newPassword,
    });

    if (result.success) {
      // Password reset successful, redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      setFieldErrors({ email: false, code: true, newPassword: true, confirmPassword: true });
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    clearResetPasswordError();
    clearConfirmPasswordResetError();
  };

  if (!mounted) {
    return null;
  }

  const isLoading = resetPasswordState.loading || confirmPasswordResetState.loading;
  const error = resetPasswordState.error || confirmPasswordResetState.error;
  const success = resetPasswordState.success || confirmPasswordResetState.success;

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
                  <LockReset fontSize="large" />
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
                Restablecer Contraseña
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: '#757575',
                  lineHeight: 1.5,
                }}
              >
                {activeStep === 0 && 'Ingresa tu correo para recibir el código'}
                {activeStep === 1 && 'Ingresa el código y tu nueva contraseña'}
              </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Mensajes de estado */}
            {error && (
              <Alert
                severity="error"
                icon={<Error />}
                sx={{ mb: 2 }}
                onClose={() => {
                  clearResetPasswordError();
                  clearConfirmPasswordResetError();
                }}
              >
                {error}
              </Alert>
            )}

            {success && activeStep === 0 && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mb: 2 }}
              >
                Código enviado a tu correo electrónico
              </Alert>
            )}

            {confirmPasswordResetState.success && activeStep === 1 && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mb: 2 }}
              >
                ¡Contraseña restablecida exitosamente! Redirigiendo al inicio de sesión...
              </Alert>
            )}

            {/* Step 0: Request Reset */}
            {activeStep === 0 && (
              <Box component="form" onSubmit={handleRequestReset} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={isLoading}
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
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <Email />}
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
                  {isLoading ? 'Enviando código...' : 'Enviar código'}
                </Button>
              </Box>
            )}

            {/* Step 1: Reset Password with Code */}
            {activeStep === 1 && (
              <Box component="form" onSubmit={handleResetPassword} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Código de verificación"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 6) {
                      setCode(value);
                    }
                  }}
                  placeholder="000000"
                  disabled={isLoading}
                  error={fieldErrors.code}
                  inputProps={{
                    maxLength: 6,
                    style: {
                      textAlign: 'center',
                      fontSize: '24px',
                      letterSpacing: '8px',
                      fontFamily: 'monospace',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Security color="action" />
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
                  label="Nueva contraseña"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  error={fieldErrors.newPassword}
                  required
                  autoComplete="new-password"
                  helperText="Mínimo 8 caracteres, con mayúscula, minúscula y número"
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
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

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    disabled={isLoading}
                    sx={{
                      height: 48,
                      borderRadius: 2,
                      flex: 1,
                    }}
                  >
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading || code.length !== 6}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <LockReset />}
                    sx={{
                      height: 48,
                      borderRadius: 2,
                      flex: 2,
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
                    {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Back to login link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Recordaste tu contraseña?{' '}
                <Link href="/auth/login" passHref legacyBehavior>
                  <MuiLink
                    sx={{
                      color: '#1976d2',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Volver al inicio de sesión
                  </MuiLink>
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}