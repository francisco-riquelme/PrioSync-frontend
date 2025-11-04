import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';
import { YouTube } from '@mui/icons-material';

interface YouTubeStepProps {
  youtubeUrl: string;
  onChange: (value: string) => void;
  error: boolean;
}

export default function YouTubeStep({ youtubeUrl, onChange, error }: YouTubeStepProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
        ¿Tienes algún recurso de YouTube que te gustaría usar?
      </Typography>
      <TextField
        fullWidth
        label="URL de YouTube"
        value={youtubeUrl}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        helperText={
          error 
            ? 'Por favor ingresa una URL válida de YouTube' 
            : 'Ej: https://www.youtube.com/watch?v=...'
        }
        placeholder="https://www.youtube.com/..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <YouTube color="action" />
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