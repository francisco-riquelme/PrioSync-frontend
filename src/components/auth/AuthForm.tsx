// src/components/auth/AuthForm.tsx
"use client";

import React, { useState } from 'react';
import GoogleIcon from './GoogleIcon';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';

// Configuración de validación
const VALIDATION_CONFIG = {
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REQUIRED: true,
  PASSWORD_REQUIRED: true
} as const;

// Mensajes de error
const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Por favor ingresa un correo electrónico válido',
  PASSWORD_TOO_SHORT: `La contraseña debe tener al menos ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} caracteres`,
  INVALID_CREDENTIALS: 'Credenciales incorrectas. Verifica tu correo y contraseña.'
} as const;

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false
  });

  // Crear una instancia reutilizable del input para validación
  const emailInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    // Crear el input una sola vez al montar el componente
    emailInputRef.current = document.createElement('input');
    emailInputRef.current.type = 'email';
  }, []);

  const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    
    // Usar la instancia reutilizable para validación nativa
    if (emailInputRef.current) {
      emailInputRef.current.value = email;
      if (emailInputRef.current.validity.valid) {
        return true;
      }
    }
    
    // Como respaldo, usa una regex más robusta (RFC 5322 simplificada)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFieldErrors({ email: false, password: false });

    if (!email || !isValidEmail(email)) {
      setError(ERROR_MESSAGES.INVALID_EMAIL);
      setFieldErrors({ email: true, password: false });
      return;
    }

    if (password.length < VALIDATION_CONFIG.PASSWORD_MIN_LENGTH) {
      setError(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
      setFieldErrors({ email: false, password: true });
      return;
    }

    // Simulación de fallo de login solo en desarrollo
    const simulateFailure = process.env.NODE_ENV === "development";
    if (simulateFailure) {
      setError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      setFieldErrors({ email: true, password: true });
      return;
    } else {
      // Simula un login exitoso (aquí se podría redirigir o limpiar el formulario)
      console.log('Datos de inicio de sesión enviados:', { email });
      setEmail('');
      setPassword('');
      setError('');
      setFieldErrors({ email: false, password: false });
      // Aquí se podría agregar lógica adicional, como redireccionar al usuario
    }
  };

  const clearErrors = () => {
    if (error) {
      setError('');
      setFieldErrors({ email: false, password: false });
    }
  };
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    clearErrors();
  };
  const handleEmailChange = handleInputChange(setEmail);
  const handlePasswordChange = handleInputChange(setPassword);

  const handleGoogleLogin = () => {
    console.log('Iniciar sesión con Google');
  };

  const handleForgotPassword = () => {
    console.log('Redirigir a recuperación de contraseña');
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#e3edfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={6} sx={{ p: 4, width: 380, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={700} color="#3b82f6" gutterBottom>
            PrioSync
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Tu asistente de tiempo inteligente
          </Typography>
        </Box>
        <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 1 }}>
          <Tab label="Iniciar Sesión" />
          <Tab label="Registrarse" />
        </Tabs>
        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            fullWidth
            size="small"
            autoComplete="current-password"
            error={fieldErrors.password}
          />
          <Box textAlign="right">
            <Button
              onClick={handleForgotPassword}
              sx={{ textTransform: 'none', color: '#3b82f6', fontWeight: 500 }}
              size="small"
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </Box>
          <Button
            type="submit"
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#3b82f6',
              fontWeight: 600,
              borderRadius: 2,
              py: 1.2,
              fontSize: 16,
              boxShadow: 1,
              '&:hover': { bgcolor: '#2563eb' },
            }}
            fullWidth
          >
            Iniciar Sesión
          </Button>
          <Divider sx={{ my: 1 }}>O</Divider>
          <Button
            onClick={handleGoogleLogin}
            variant="outlined"
            startIcon={<GoogleIcon />}
            sx={{
              textTransform: 'none',
              bgcolor: '#fff',
              color: '#222',
              borderColor: '#e0e0e0',
              fontWeight: 500,
              mb: 1,
              '&:hover': { bgcolor: '#f5f5f5', borderColor: '#bdbdbd' },
            }}
            fullWidth
          >
            Continuar con Google
          </Button>
        </Box>
      
      </Paper>
    </Box>
  );
}