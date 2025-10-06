"use client";

"use client";

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  AppBar, 
  Toolbar, 
  Container,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import Link from 'next/link';
import { School, CalendarToday, Assessment } from '@mui/icons-material';
import WelcomeModal from '../modals/welcome/WelcomeModal';
import { WelcomeFormData } from '../modals/welcome/types';
import RegistrationModal from '../modals/registration/RegistrationModal';
import { RegistrationFormData } from '../modals/registration/types';

export default function LandingPage() {
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [welcomeData, setWelcomeData] = useState<WelcomeFormData | null>(null);

  const handleWelcomeComplete = (data: WelcomeFormData) => {
    setWelcomeData(data);
    setWelcomeModalOpen(false);
    setRegistrationModalOpen(true);
  };

  const handleRegistration = (data: RegistrationFormData) => {
    // Aquí enviarías los datos a tu backend de AWS
    console.log('Datos completos del usuario:', data);
    
    // Cerrar modales y resetear
    setRegistrationModalOpen(false);
    setWelcomeData(null);
    
    // Aquí podrías redirigir al dashboard o mostrar un mensaje de éxito
    alert('¡Registro completado con éxito!');
  };

  const openWelcomeModal = () => {
    setWelcomeModalOpen(true);
  };
  return (
    <Box>
      {/* Navbar */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Container maxWidth="lg">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              PrioSync
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mr: 2 }}>
              <Link href="#inicio" style={{ color: 'white', textDecoration: 'none' }}>
                Inicio
              </Link>
              <Link href="#funcionalidades" style={{ color: 'white', textDecoration: 'none' }}>
                Funcionalidades
              </Link>
              <Link href="#contacto" style={{ color: 'white', textDecoration: 'none' }}>
                Contacto
              </Link>
            </Stack>
            <Button 
              variant="outlined" 
              sx={{ color: 'white', borderColor: 'white', mr: 1 }}
            >
              Iniciar Sesión
            </Button>
            <Link href="/dashboard" passHref>
              <Button 
                variant="contained" 
                sx={{ backgroundColor: 'white', color: '#1976d2' }}
              >
                Dashboard
              </Button>
            </Link>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box 
        id="inicio"
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 8,
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            ¡Bienvenido a PrioSync!
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            La plataforma integral para la gestión académica moderna
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, fontSize: '1.2rem', maxWidth: '600px', mx: 'auto' }}>
            Organiza tus estudios, gestiona tus horarios y mantente al día con tus evaluaciones 
            en una sola plataforma intuitiva y eficiente.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={openWelcomeModal}
            sx={{ backgroundColor: 'white', color: '#667eea', py: 1.5, px: 4 }}
          >
            Comenzar Ahora
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="funcionalidades" sx={{ py: 8, backgroundColor: '#f5f5f5' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom textAlign="center" sx={{ mb: 6, color: '#333' }}>
            Funcionalidades Principales
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
              <CardContent>
                <CalendarToday sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Gestión de Horarios
                </Typography>
                <Typography variant="body1">
                  Organiza tu calendario académico con facilidad. Programa clases, 
                  estudios y actividades extracurriculares en una interfaz intuitiva.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
              <CardContent>
                <School sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Seguimiento Académico
                </Typography>
                <Typography variant="body1">
                  Mantén un registro detallado de tus materias, notas y progreso académico. 
                  Visualiza tu rendimiento con gráficos y estadísticas.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, textAlign: 'center', p: 2 }}>
              <CardContent>
                <Assessment sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Control de Evaluaciones
                </Typography>
                <Typography variant="body1">
                  No te pierdas ninguna evaluación importante. Recibe recordatorios 
                  y organiza tu tiempo de estudio de manera efectiva.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box id="contacto" sx={{ backgroundColor: '#1976d2', color: 'white', py: 2 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                PrioSync
              </Typography>
              <Typography variant="body2">
                Tu compañero ideal para el éxito académico
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>
                Enlaces Rápidos
              </Typography>
              <Stack spacing={1}>
                <Link href="#inicio" style={{ color: 'white', textDecoration: 'none' }}>
                  Inicio
                </Link>
                <Link href="#funcionalidades" style={{ color: 'white', textDecoration: 'none' }}>
                  Funcionalidades
                </Link>
                <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                  Dashboard
                </Link>
              </Stack>
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>
                Contacto
              </Typography>
              <Typography variant="body2">
                Email: info@priosync.com
              </Typography>
              <Typography variant="body2">
                Teléfono: +56 9 1234 5678
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ borderTop: '1px solid #555', mt: 2, pt: 1.5, textAlign: 'center' }}>
            <Typography variant="body2">
              © 2024 PrioSync. Todos los derechos reservados.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Modales */}
      <WelcomeModal
        open={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        onComplete={handleWelcomeComplete}
      />

      <RegistrationModal
        open={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        welcomeData={welcomeData || undefined}
        onRegister={handleRegistration}
      />
    </Box>
  );
}