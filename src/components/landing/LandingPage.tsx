"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { 
  Box, 
  Typography, 
  Button, 
  AppBar, 
  Toolbar, 
  Container,
  Stack,
  Card,
  CardContent,
  Backdrop,
  CircularProgress,
  Fade,
  Grow
} from '@mui/material';
import Link from 'next/link';
import { School, CalendarToday, Assessment, Visibility, Flag } from '@mui/icons-material';
import WelcomeModal from '../modals/welcome/WelcomeModal';
import { WelcomeFormData } from '../modals/welcome/types';
import RegistrationModal from '../modals/registration/RegistrationModal';
import { RegistrationFormData } from '../modals/registration/types';
import MessageDialog from '../common/MessageDialog';
import { generateRecurringStudySessions, createSessionsInBatch } from '@/utils/studySessionUtils';
import { useStudySessions } from '@/components/courses/hooks/useStudySessions';
import { ENABLE_REGISTRATION } from '@/config/registration';

// Hook para detectar cuando un elemento entra en el viewport
function useIntersectionObserver(ref: React.RefObject<HTMLElement | null>, options = {}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, options]);

  return isVisible;
}

export default function LandingPage() {
  const router = useRouter();
  const { userData, loading } = useUser();
  const { createSession } = useStudySessions();
  
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [welcomeData, setWelcomeData] = useState<WelcomeFormData | null>(null);
  const [isCreatingSessions, setIsCreatingSessions] = useState(false);

  // Refs para las secciones que queremos animar
  const featuresRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const visionRef = useRef<HTMLDivElement>(null);
  
  // Observadores de intersección
  const featuresVisible = useIntersectionObserver(featuresRef);
  const missionVisible = useIntersectionObserver(missionRef);
  const visionVisible = useIntersectionObserver(visionRef);

  // Redirect automático si el usuario está autenticado
  useEffect(() => {
    if (!loading && userData) {
      // Usuario autenticado, redirigir a dashboard
      console.log('✅ Usuario autenticado detectado, redirigiendo a dashboard...');
      router.push('/dashboard');
    }
  }, [loading, userData, router]);
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    type: 'success' as 'success' | 'error' | 'info' | 'warning',
    title: '',
    message: '' as string | React.ReactNode,
    onConfirm: () => {},
  });

  const handleWelcomeComplete = (data: WelcomeFormData) => {
    // Solo abrir el modal de registro si está habilitado
    if (!ENABLE_REGISTRATION) {
      setMessageDialog({
        open: true,
        type: 'info',
        title: 'Registro Deshabilitado',
        message: 'El registro de nuevos usuarios está temporalmente deshabilitado. Por favor, contacta al administrador si necesitas acceso.',
        onConfirm: () => setMessageDialog({ ...messageDialog, open: false }),
      });
      setWelcomeModalOpen(false);
      return;
    }
    setWelcomeData(data);
    setWelcomeModalOpen(false);
    setRegistrationModalOpen(true);
  };

  const handleWelcomeClose = () => {
    setWelcomeModalOpen(false);
  };

  const handleRegistration = async (data: RegistrationFormData) => {
    try {
      setIsCreatingSessions(true);
      
      // TODO: Aquí deberías crear el usuario en AWS Amplify Auth/Cognito
      // Por ahora simulamos un usuarioId temporal
      const tempUsuarioId = crypto.randomUUID();
      
      console.log('📝 Datos del registro:', data);
      console.log('📅 Datos de disponibilidad:', welcomeData);
      
      // Si hay datos de disponibilidad, crear sesiones recurrentes
      if (welcomeData && welcomeData.tiempoDisponible.length > 0) {
        console.log('🔄 Generando sesiones recurrentes para las próximas 6 semanas...');
        
        // Generar las sesiones basadas en la disponibilidad
        const sessions = generateRecurringStudySessions(
          welcomeData.tiempoDisponible,
          tempUsuarioId,
          6 // 6 semanas
        );
        
        console.log(`📊 Total de sesiones a crear: ${sessions.length}`);
        
        // Crear las sesiones en batch
        const result = await createSessionsInBatch(sessions, createSession);
        
        console.log('✅ Resultado de creación:', result);
        
        if (result.success > 0) {
          // Cerrar modales y limpiar
          setRegistrationModalOpen(false);
          setWelcomeData(null);
          
          // NO limpiar localStorage aquí - será necesario para la migración después del login
          // localStorage.removeItem('welcomeFormData'); // ❌ NO BORRAR TODAVÍA
          // localStorage.removeItem('registrationFormData');
          
          // Mostrar mensaje de éxito con modal
          setMessageDialog({
            open: true,
            type: 'success',
            title: '¡Registro Completado con Éxito!',
            message: (
              <Box>
                <Typography variant="body1" gutterBottom>
                  ✅ Se crearon <strong>{result.success}</strong> sesiones de estudio en tu calendario.
                </Typography>
                <Typography variant="body1">
                  📅 Revisa las próximas 6 semanas de horarios disponibles.
                </Typography>
              </Box>
            ),
            onConfirm: () => {
              setMessageDialog({ ...messageDialog, open: false });
              router.push('/calendar');
            }
          });
        } else {
          throw new Error('No se pudieron crear las sesiones de estudio');
        }
      } else {
        // Si no hay disponibilidad, solo completar registro
        setRegistrationModalOpen(false);
        setWelcomeData(null);
        
        // Mostrar mensaje de éxito simple
        setMessageDialog({
          open: true,
          type: 'success',
          title: '¡Registro Completado!',
          message: 'Tu cuenta ha sido creada exitosamente.',
          onConfirm: () => {
            setMessageDialog({ ...messageDialog, open: false });
            router.push('/dashboard');
          }
        });
      }
    } catch (error) {
      console.error('❌ Error en el registro:', error);
      
      // Mostrar mensaje de error con modal
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Error en el Registro',
        message: 'No se pudo completar el registro. Por favor, intenta nuevamente.',
        onConfirm: () => setMessageDialog({ ...messageDialog, open: false })
      });
    } finally {
      setIsCreatingSessions(false);
    }
  };

  const handleRegistrationClose = () => {
    // Limpiar localStorage ANTES de cerrar el modal
    if (typeof window !== 'undefined') {
      localStorage.removeItem('registrationFormData');
    }
    setRegistrationModalOpen(false);
  };

  const openWelcomeModal = () => {
    setWelcomeModalOpen(true);
  };
  return (
    <Box>
      {/* Navbar */}
      <AppBar position="static" sx={{ backgroundColor: 'primary.main' }}>
        <Container maxWidth="lg">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              PrioSync
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mr: 2 }}>
              <Link 
                href="#inicio" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'opacity 0.3s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Inicio
              </Link>
              <Link 
                href="#funcionalidades" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'opacity 0.3s' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Funcionalidades
              </Link>
              <Link 
                href="#mision-vision" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'opacity 0.3s' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Misión y Visión
              </Link>
              <Link 
                href="#contacto" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  transition: 'opacity 0.3s' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Contacto
              </Link>
            </Stack>
            {!loading && !userData && (
              <Button 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'white' }}
                onClick={() => router.push('/auth/login')}
              >
                Iniciar Sesión
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box 
        id="inicio"
        sx={{ 
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          py: { xs: 6, md: 10 },
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={1000}>
            <Box>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 2,
                  animation: 'fadeInUp 0.8s ease-out'
                }}
              >
                ¡Bienvenido a PrioSync!
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  fontSize: { xs: '1.1rem', md: '1.5rem' },
                  animation: 'fadeInUp 0.8s ease-out 0.2s both'
                }}
              >
                La plataforma integral para la gestión académica moderna
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4, 
                  fontSize: { xs: '1rem', md: '1.2rem' }, 
                  maxWidth: '600px', 
                  mx: 'auto',
                  animation: 'fadeInUp 0.8s ease-out 0.4s both'
                }}
              >
                Organiza tus estudios, gestiona tus horarios y mantente al día con tus evaluaciones 
                en una sola plataforma intuitiva y eficiente.
              </Typography>
              <Box sx={{ animation: 'fadeInUp 0.8s ease-out 0.6s both' }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={openWelcomeModal}
                  sx={{ 
                    backgroundColor: 'white', 
                    color: 'primary.main',
                    py: 1.5, 
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.3)',
                    }
                  }}
                >
                  Comenzar Ahora
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Features Section */}
      <Box 
        id="funcionalidades" 
        ref={featuresRef}
        sx={{ 
          py: { xs: 6, md: 10 }, 
          backgroundColor: 'background.default',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          opacity: featuresVisible ? 1 : 0,
          transform: featuresVisible ? 'translateY(0)' : 'translateY(30px)'
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom 
            textAlign="center" 
            sx={{ 
              mb: 6, 
              color: 'text.primary',
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 'bold'
            }}
          >
            Funcionalidades Principales
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Grow in={featuresVisible} timeout={800}>
              <Card 
                sx={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  p: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardContent>
                  <CalendarToday sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    Gestión de Horarios
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Organiza tu calendario académico con facilidad. Programa clases, 
                    estudios y actividades extracurriculares en una interfaz intuitiva.
                  </Typography>
                </CardContent>
              </Card>
            </Grow>

            <Grow in={featuresVisible} timeout={1000}>
              <Card 
                sx={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  p: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardContent>
                  <School sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    Seguimiento Académico
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Mantén un registro detallado de tus materias, notas y progreso académico. 
                    Visualiza tu rendimiento con gráficos y estadísticas.
                  </Typography>
                </CardContent>
              </Card>
            </Grow>

            <Grow in={featuresVisible} timeout={1200}>
              <Card 
                sx={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  p: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardContent>
                  <Assessment sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    Control de Evaluaciones
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No te pierdas ninguna evaluación importante. Recibe recordatorios 
                    y organiza tu tiempo de estudio de manera efectiva.
                  </Typography>
                </CardContent>
              </Card>
            </Grow>
          </Stack>
        </Container>
      </Box>

      {/* Misión y Visión Section */}
      <Box 
        id="mision-vision"
        sx={{ 
          py: { xs: 6, md: 10 },
          background: (theme) => `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.primary.light}15 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom 
            textAlign="center" 
            sx={{ 
              mb: 6, 
              color: 'text.primary',
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 'bold'
            }}
          >
            Misión y Visión
          </Typography>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            {/* Misión */}
            <Box 
              ref={missionRef}
              sx={{
                flex: 1,
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                opacity: missionVisible ? 1 : 0,
                transform: missionVisible ? 'translateX(0)' : 'translateX(-30px)'
              }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  p: 4,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.2)',
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Flag sx={{ fontSize: 50, mr: 2 }} />
                    <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold' }}>
                      Nuestra Misión
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    Facilitar el acceso a una educación estructurada y de calidad mediante la 
                    transformación inteligente de contenido educativo en experiencias de aprendizaje 
                    organizadas y personalizadas. Nos comprometemos a optimizar el tiempo de estudio 
                    de nuestros usuarios, proporcionando herramientas que estructuran el conocimiento, 
                    generan materiales complementarios y adaptan el aprendizaje a las necesidades 
                    individuales de cada estudiante.
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Visión */}
            <Box 
              ref={visionRef}
              sx={{
                flex: 1,
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                opacity: visionVisible ? 1 : 0,
                transform: visionVisible ? 'translateX(0)' : 'translateX(30px)'
              }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  p: 4,
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.2)',
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Visibility sx={{ fontSize: 50, mr: 2 }} />
                    <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold' }}>
                      Nuestra Visión
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    Ser la plataforma de referencia que democratiza el aprendizaje estructurado, 
                    convirtiendo cualquier contenido educativo de YouTube en experiencias de estudio 
                    completas y personalizadas. Aspiramos a revolucionar la forma en que los estudiantes 
                    consumen y organizan contenido educativo, aprovechando la inteligencia artificial 
                    para crear materiales de estudio de calidad profesional y optimizar el tiempo de 
                    aprendizaje de cada usuario.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        id="contacto" 
        sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white', 
          py: { xs: 4, md: 6 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="space-between">
            <Fade in timeout={1000}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                  PrioSync
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Tu compañero ideal para el éxito académico
                </Typography>
              </Box>
            </Fade>
            <Fade in timeout={1200}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Enlaces Rápidos
                </Typography>
                <Stack spacing={1}>
                  <Link href="#inicio" style={{ color: 'white', textDecoration: 'none', opacity: 0.9, transition: 'opacity 0.3s' }}>
                    Inicio
                  </Link>
                  <Link href="#funcionalidades" style={{ color: 'white', textDecoration: 'none', opacity: 0.9, transition: 'opacity 0.3s' }}>
                    Funcionalidades
                  </Link>
                  <Link href="#mision-vision" style={{ color: 'white', textDecoration: 'none', opacity: 0.9, transition: 'opacity 0.3s' }}>
                    Misión y Visión
                  </Link>
                  <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none', opacity: 0.9, transition: 'opacity 0.3s' }}>
                    Dashboard
                  </Link>
                </Stack>
              </Box>
            </Fade>
            <Fade in timeout={1400}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Contacto
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Email: info@priosync.com
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Teléfono: +56 9 1234 5678
                </Typography>
              </Box>
            </Fade>
          </Stack>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.2)', mt: 4, pt: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              © 2025 PrioSync. Todos los derechos reservados.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Modales */}
      <WelcomeModal
        open={welcomeModalOpen}
        onClose={handleWelcomeClose}
        onComplete={handleWelcomeComplete}
      />

      <RegistrationModal
        open={registrationModalOpen}
        onClose={handleRegistrationClose}
        welcomeData={welcomeData || undefined}
        onRegister={handleRegistration}
      />

      {/* Backdrop de carga mientras se crean las sesiones */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={isCreatingSessions}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6">
          Configurando tu calendario...
        </Typography>
        <Typography variant="body2">
          Creando tus sesiones de estudio para las próximas 6 semanas
        </Typography>
      </Backdrop>

      {/* Modal de mensajes (éxito/error) */}
      <MessageDialog
        open={messageDialog.open}
        onClose={() => setMessageDialog({ ...messageDialog, open: false })}
        type={messageDialog.type}
        title={messageDialog.title}
        message={messageDialog.message}
        onConfirm={messageDialog.onConfirm}
      />
    </Box>
  );
}