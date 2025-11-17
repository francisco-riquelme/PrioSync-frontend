'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
import CoursesList from '@/components/courses/CoursesList';
import { Box, CircularProgress } from '@mui/material';

export default function CoursesPage() {
  const { userData, loading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !userData) {
      router.push('/');
    }
  }, [userData, loading, router, mounted]);

  // Evitar render hasta que esté montado en el cliente
  if (!mounted) {
    return null;
  }

  // Mostrar loading dentro del layout para evitar parpadeo
  if (loading || !userData) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CoursesList />
    </AppLayout>
  );
}