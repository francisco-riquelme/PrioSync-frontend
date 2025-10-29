'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
import StudyHoursManager from '@/components/study-hours/StudyHoursManager';
import { Box, CircularProgress } from '@mui/material';

export default function StudyHoursPage() {
  const router = useRouter();
  const { userData, loading } = useUser();

  // Proteger la ruta - redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !userData) {
      router.push('/');
    }
  }, [userData, loading, router]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  // Si no hay usuario autenticado, no renderizar nada (se redirigirá)
  if (!userData) {
    return null;
  }

  return (
    <AppLayout>
      <StudyHoursManager />
    </AppLayout>
  );
}
