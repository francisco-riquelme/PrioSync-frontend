import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack
} from '@mui/material';
import { School, YouTube } from '@mui/icons-material';

interface StudyResourcesStepProps {
  estudio: string;
  youtubeUrl: string;
  onStudyChange: (value: string) => void;
  onYouTubeChange: (value: string) => void;
  studyError: boolean;
  youtubeError: boolean;
}

export default function StudyResourcesStep({ 
  estudio, 
  youtubeUrl, 
  onStudyChange, 
  onYouTubeChange, 
  studyError, 
  youtubeError 
}: StudyResourcesStepProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 3 }}>
        ¿Qué te gustaría estudiar y qué recursos tienes?
      </Typography>
      
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="¿Qué quieres estudiar?"
          value={estudio}
          onChange={(e) => onStudyChange(e.target.value)}
          error={studyError}
          helperText={studyError ? 'Por favor describe qué quieres estudiar' : 'Ej: Matemáticas, Programación, Idiomas, etc.'}
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

        <TextField
          fullWidth
          label="URL de YouTube (opcional)"
          value={youtubeUrl}
          onChange={(e) => onYouTubeChange(e.target.value)}
          error={youtubeError}
          helperText={
            youtubeError 
              ? 'Por favor ingresa una URL válida de YouTube' 
              : 'Si tienes algún video o canal de YouTube que quieras usar como recurso'
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
      </Stack>
    </Box>
  );
}