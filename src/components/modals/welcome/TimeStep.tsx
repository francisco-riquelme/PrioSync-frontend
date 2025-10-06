import React from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import { AccessTime } from '@mui/icons-material';
// Deprecated component - replaced by ScheduleStep
const timeOptions = [
  { value: "1-2h", label: "1-2 horas al día" },
  { value: "2-4h", label: "2-4 horas al día" },
  { value: "4-6h", label: "4-6 horas al día" },
];

interface TimeStepProps {
  tiempoDisponible: string;
  onChange: (value: string) => void;
  error: boolean;
}

export default function TimeStep({ tiempoDisponible, onChange, error }: TimeStepProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        ¿Cuánto tiempo tienes disponible para estudiar?
      </Typography>
      <FormControl fullWidth error={error}>
        <InputLabel>Tiempo disponible</InputLabel>
        <Select
          value={tiempoDisponible}
          onChange={(e) => onChange(e.target.value)}
          label="Tiempo disponible"
          startAdornment={
            <InputAdornment position="start">
              <AccessTime color="action" />
            </InputAdornment>
          }
          sx={{
            borderRadius: 2,
          }}
        >
          {timeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            Por favor selecciona tu disponibilidad de tiempo
          </Typography>
        )}
      </FormControl>
    </Box>
  );
}