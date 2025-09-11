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

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState(0);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Datos de inicio de sesión enviados:', { email, password });
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
          <TextField
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="email"
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
            size="small"
            autoComplete="current-password"
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