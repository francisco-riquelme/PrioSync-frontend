import React from 'react';
import { TextField, InputAdornment, Stack } from '@mui/material';
import { Person, Person2, Phone, Email, Lock } from '@mui/icons-material';

interface RegistrationFormProps {
  formData: {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  errors: {
    nombre: boolean;
    apellido: boolean;
    telefono: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
  };
  loading: boolean;
  onNombreChange: (value: string) => void;
  onApellidoChange: (value: string) => void;
  onTelefonoChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function RegistrationForm({
  formData,
  errors,
  loading,
  onNombreChange,
  onApellidoChange,
  onTelefonoChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}: RegistrationFormProps) {
  return (
    <form id="registration-form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            placeholder="Tu nombre"
            disabled={loading}
            error={errors.nombre}
            required
            autoComplete="given-name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
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
            label="Apellido"
            type="text"
            value={formData.apellido}
            onChange={(e) => onApellidoChange(e.target.value)}
            placeholder="Tu apellido"
            disabled={loading}
            error={errors.apellido}
            required
            autoComplete="family-name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person2 color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
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
        </Stack>

        <TextField
          fullWidth
          label="Teléfono móvil"
          type="tel"
          value={formData.telefono}
          onChange={(e) => onTelefonoChange(e.target.value)}
          placeholder="+56912345678"
          disabled={loading}
          error={errors.telefono}
          required
          autoComplete="tel"
          helperText="Formato: +56912345678"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
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
          label="Correo electrónico"
          type="email"
          value={formData.email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="tu@email.com"
          disabled={loading}
          error={errors.email}
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
          value={formData.password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          disabled={loading}
          error={errors.password}
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
        value={formData.confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        placeholder="••••••••"
        disabled={loading}
        error={errors.confirmPassword}
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
      </Stack>
    </form>
  );
}