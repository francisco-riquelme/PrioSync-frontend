import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';
import { School } from '@mui/icons-material';

interface StudyStepProps {
  estudio: string;
  onChange: (value: string) => void;
  error: boolean;
}

export default function StudyStep({ estudio, onChange, error }: StudyStepProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
        ¿Qué te gustaría estudiar?
      </Typography>
      <TextField
        fullWidth
        label="¿Qué quieres estudiar?"
        value={estudio}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        helperText={error ? 'Por favor describe qué quieres estudiar' : 'Ej: Matemáticas, Programación, Idiomas, etc.'}
        placeholder="Describe tu área de estudio"
        multiline
        rows={3}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <School color="action" />
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