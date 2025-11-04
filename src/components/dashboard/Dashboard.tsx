'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useCursosConProgreso } from '@/hooks/useCursosConProgreso';
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
  Alert,
} from '@mui/material';
import { Person as PersonIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import ImportCourseModal from './ImportCourseModal';

export default function Dashboard() {
  const router = useRouter();
  const { userData, loading, refreshUser } = useUser();
  const { cursos, loading: cursosLoading, error: cursosError, recargar } = useCursosConProgreso();
  
  const [aiAdvice, setAiAdvice] = useState<string>('**Evalúa tu conocimiento activamente sin consultar tus apuntes para identificar lagunas y reforzar el aprendizaje.**');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
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
  
  // Guard: loading/auth
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayName = userData?.nombre || 'Usuario';

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

  const handleImportSuccess = async () => {
    // Refresh user data to get the new course
    await refreshUser();
    // Refresh course progress
    await recargar();
  };


  // Prepare user data
  const greeting = `¡Hola, ${displayName}!`;

  return (
    <Box>
      {/* Import Modal */}
      <ImportCourseModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        userId={userData?.usuarioId || ''}
        onSuccess={handleImportSuccess}
      />

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Progreso de Cursos
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloudUploadIcon />}
                onClick={() => setImportModalOpen(true)}
              >
                Importar Curso
              </Button>
            </Box>
            <Box sx={{ mt: 2 }}>
              {cursosLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : cursosError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {cursosError}
                </Alert>
              ) : cursos.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tienes cursos inscritos aún.
                </Typography>
              ) : (
                cursos.map((curso) => {
                  return (
                    <Box key={curso.cursoId} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {curso.titulo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {curso.progreso}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={curso.progreso}
                        sx={{
                          height: 8,
                          borderRadius: 3,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: 'success.main',
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
