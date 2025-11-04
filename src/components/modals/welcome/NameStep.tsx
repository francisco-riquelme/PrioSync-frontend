import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';
import { Person } from '@mui/icons-material';

interface NameStepProps {
  nombre: string;
  onChange: (value: string) => void;
  error: boolean;
}

export default function NameStep({ nombre, onChange, error }: NameStepProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
        ¡Hola! Empecemos conociéndote mejor
      </Typography>
      <TextField
        fullWidth
        label="¿Cuál es tu nombre?"
        value={nombre}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        helperText={error ? 'Por favor ingresa tu nombre' : ''}
        placeholder="Escribe tu nombre aquí"
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
          },
        }}
      />
    </Box>
  );
}