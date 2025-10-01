'use client';

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
} from '@mui/material';
import {
  VerifiedUser,
  Email,
  Security,
  Refresh,
  CheckCircle,
  Error,
  Help,
} from '@mui/icons-material';
import authService from '@/utils/services/auth';

export default function VerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Verificar si el formulario es válido
  const isFormValid = (): boolean => {
    return authService.validateEmail(email) && authService.validateConfirmationCode(code);
  };

  // Función para manejar la verificación
  const handleVerification = async () => {
    if (!isFormValid()) {
      setError('Por favor completa todos los campos correctamente');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.confirmSignUp({
        email,
        confirmationCode: code,
      });

      if (result.success) {
        setSuccess('¡Código verificado correctamente! Redirigiendo al dashboard...');
        // Redirigir al dashboard (página principal) después de 2 segundos
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(result.error || 'Código incorrecto. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error(error);
      setError('Error al verificar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para reenviar código
  const handleResendCode = async () => {
    if (!authService.validateEmail(email)) {
      setError('Por favor ingresa un email válido primero');
      return;
    }

    setCanResend(false);
    setCountdown(60);
    setError('');
    setSuccess('');

    // Simular reenvío (en una implementación real, esto llamaría a un servicio de reenvío)
    setTimeout(() => {
      setSuccess('Código reenviado a tu correo electrónico');
      setCode('');
    }, 1000);
  };

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Manejar Enter en el campo de código
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && isFormValid() && !loading) {
      handleVerification();
    }
  };

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
                }}
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
                  <VerifiedUser fontSize="large" />
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
                Verificación de Código
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: '#757575',
                  lineHeight: 1.5,
                }}
              >
                Ingresa el código de 6 dígitos que enviamos a tu correo electrónico
              </Typography>
            </Box>

            {/* Mensajes de estado */}
            {error && (
              <Alert
                severity="error"
                icon={<Error />}
                sx={{ mb: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mb: 2 }}
                onClose={() => setSuccess('')}
              >
                {success}
              </Alert>
            )}

            {/* Formulario */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
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
                label="Código de verificación"
                value={code}
                onChange={(e) => {
                  // Solo permitir números
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) {
                    setCode(value);
                  }
                }}
                placeholder="000000"
                disabled={loading}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: 'center',
                    fontSize: '24px',
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                  },
                }}
                onKeyPress={handleKeyPress}
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
            </Box>

            {/* Botón de verificación */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerification}
              disabled={!isFormValid() || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <VerifiedUser />}
              sx={{
                mb: 3,
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
              {loading ? 'Verificando...' : 'Verificar Código'}
            </Button>

            {/* Sección de reenvío */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ¿No recibiste el código?
              </Typography>
              
              {canResend ? (
                <Button
                  variant="text"
                  onClick={handleResendCode}
                  disabled={loading}
                  startIcon={<Refresh />}
                  sx={{
                    color: '#1976d2',
                    textDecoration: 'underline',
                    '&:hover': {
                      color: '#1565c0',
                      backgroundColor: 'transparent',
                    },
                    '&:disabled': {
                      color: '#9e9e9e',
                    },
                  }}
                >
                  Reenviar código
                </Button>
              ) : (
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                  Reenviar en {countdown}s
                </Typography>
              )}
            </Box>

            {/* Sección de ayuda */}
            <Box
              sx={{
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 1,
                }}
              >
                <Help color="action" />
                <Typography variant="h6" sx={{ fontWeight: 500, color: '#424242' }}>
                  ¿Necesitas ayuda?
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                Si tienes problemas para recibir el código, verifica que tu correo electrónico sea correcto y revisa tu carpeta de spam.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
