'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
import CoursesList from '@/components/courses/CoursesList';

export default function CoursesPage() {
  const { userData, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/auth/login');
    }
  }, [userData, loading, router]);

  if (loading) return <div>Cargando...</div>;
  if (!userData) return null;

  return (
    <AppLayout>
      <CoursesList />
    </AppLayout>
  );
}