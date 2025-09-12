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

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false
  });

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFieldErrors({ email: false, password: false });

    if (!email || !isValidEmail(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      setFieldErrors({ email: true, password: false });
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setFieldErrors({ email: false, password: true });
      return;
    }

    // Simulación configurable: falla el login solo si la variable de entorno lo indica
    const simulateFailure = process.env.NEXT_PUBLIC_SIMULATE_LOGIN_FAILURE === "true";
    if (simulateFailure) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      setFieldErrors({ email: true, password: true });
      return;
    } else {
      // Simula un login exitoso (aquí se podría redirigir o limpiar el formulario)
      console.log('Datos de inicio de sesión enviados:', { email, password });
      setEmail('');
      setPassword('');
      setError('');
      setFieldErrors({ email: false, password: false });
      // Aquí se podría agregar lógica adicional, como redireccionar al usuario
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
      setFieldErrors({ email: false, password: false });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError('');
      setFieldErrors({ email: false, password: false });
    }
  };

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