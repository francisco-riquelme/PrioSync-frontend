'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useDashboard } from '@/hooks/useUserData';

export default function Dashboard() {
  const router = useRouter();
  const { dashboardData, generateAIAdvice } = useDashboard();
  const [aiAdvice, setAiAdvice] = useState<string>('**Evalúa tu conocimiento activamente sin consultar tus apuntes para identificar lagunas y reforzar el aprendizaje.**');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const handleGenerateAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const advice = await generateAIAdvice();
      setAiAdvice(`**${advice}**`);
    } catch (error) {
      console.error('Error generating advice:', error);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const navigateToProfile = () => {
    router.push('/perfil');
  };

  if (!dashboardData.user.name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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
          <Card sx={{ p: 2, backgroundColor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {dashboardData.user.greeting}
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
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={navigateToProfile}
                  sx={{ ml: 2 }}
                >
                  Ver Perfil
                </Button>
              </Box>
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
              {dashboardData.courses.list.map((course) => (
                <Box key={course.courseId} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {course.courseName}
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
              onClick={handleGenerateAdvice}
              disabled={loadingAdvice}
              sx={{
                mb: 2,
                py: 1.5,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loadingAdvice ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  Generando...
                </Box>
              ) : (
                'Dame un consejo'
              )}
            </Button>

            <Box
              sx={{
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                p: 2,
                borderRadius: 2
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                {aiAdvice}
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
