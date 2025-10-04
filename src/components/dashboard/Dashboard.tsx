'use client';

import React, { useState, useCallback } from 'react';
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
import { useAuth } from '@/components/auth/hooks/auth';
import { useUsuario } from '@/components/courses/hooks/useUsuario';
import { MainTypes } from '@/utils/api/schema';

type InscripcionCurso = MainTypes["InscripcionCurso"]["type"];

export default function Dashboard() {
  const router = useRouter();
  const { authSession } = useAuth();
  const { usuario, inscripciones, loading, error } = useUsuario(authSession.user?.userId);
  const [aiAdvice, setAiAdvice] = useState<string>('**Evalúa tu conocimiento activamente sin consultar tus apuntes para identificar lagunas y reforzar el aprendizaje.**');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Generate AI advice function
  const generateAIAdvice = useCallback(async () => {
    const advices = [
      "Evalúa tu conocimiento activamente sin consultar tus apuntes para identificar lagunas y reforzar el aprendizaje.",
      "Dedica 25 minutos de estudio concentrado seguidos de 5 minutos de descanso (Técnica Pomodoro).",
      "Enseña lo que has aprendido a alguien más. Es una excelente forma de consolidar conocimientos.",
      "Revisa tus notas al final del día para reforzar la memoria a largo plazo.",
      "Establece metas de estudio pequeñas y alcanzables para mantener la motivación alta.",
    ];

    // Simular procesamiento de IA
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Usar Math.random solo en el cliente
    let randomAdvice = advices[0];
    if (typeof window !== 'undefined') {
      randomAdvice = advices[Math.floor(Math.random() * advices.length)];
    }
    return randomAdvice;
  }, []);

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
    router.push('/profile');
  };

  // Show loading state
  if (loading || authSession.isLoading || !usuario) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Prepare user data
  const userName = usuario?.nombre
    ? `${usuario.nombre}${usuario.apellido ? " " + usuario.apellido : ""}`
    : "Usuario";
  const greeting = `¡Hola, ${usuario?.nombre || "Usuario"}!`;

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
                  {greeting}
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
              {inscripciones.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tienes cursos inscritos aún.
                </Typography>
              ) : (
                inscripciones.map((inscripcion: InscripcionCurso) => {
                  // Calculate progress based on estado
                  const progress = inscripcion.estado === 'completado' ? 100
                                : inscripcion.estado === 'en_progreso' ? 50
                                : 0;
                  
                  return (
                    <Box key={inscripcion.cursoId} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {inscripcion.cursoId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
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
                  );
                })
              )}
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
