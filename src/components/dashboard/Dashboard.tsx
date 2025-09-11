'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
// import {
//   Psychology as PsychologyIcon,
// } from '@mui/icons-material';

export default function Dashboard() {
  const progressData = [
    { subject: 'Cálculo Avanzado', progress: 85 },
    { subject: 'Desarrollo de Software', progress: 65 },
    { subject: 'Inteligencia Artificial', progress: 78 },
    { subject: 'Gestión de Proyectos', progress: 72 },
  ];

  return (
    <Box>
      {/* Primera fila */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Saludo personalizado */}
        <Card sx={{ p: 2, backgroundColor: 'secondary.light' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              ¡Hola, Francisco!
            </Typography>
            <Typography
              variant="body1"
              sx={{ 
                fontStyle: 'italic',
                color: 'text.secondary',
                mb: 2 
              }}
            >
              &ldquo;Con cada esfuerzo, forjas tu destino.&rdquo;
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: 'primary.main',
                  fontSize: '0.75rem',
                }}
              >
                IA
              </Avatar>
              <Chip
                label="Generado con IA"
                size="small"
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Progreso de cursos */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Progreso de Cursos
            </Typography>
            <Box sx={{ mt: 2 }}>
              {progressData.map((course, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {course.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={course.progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: 'primary.main',
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Segunda fila */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Asistente de Estudio IA */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Asistente de Estudio IA
            </Typography>
            
            <Button
              variant="contained"
              fullWidth
              sx={{
                mb: 2,
                py: 1.5,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Dame un consejo
            </Button>

            <Box
              sx={{
                backgroundColor: 'secondary.light',
                p: 2,
                borderRadius: 2
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontStyle: 'italic',
                  color: 'text.primary',
                  lineHeight: 1.6,
                }}
              >
                **Evalúa tu conocimiento activamente sin consultar tus 
                apuntes para identificar lagunas y reforzar el aprendizaje.**
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recomendaciones para ti
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              ¡Completa más cursos para recibir recomendaciones!
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
