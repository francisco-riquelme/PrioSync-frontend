'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
import { Calendar } from '@/components/calendar';

export default function CalendarPage() {
  const { userData, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/');
    }
  }, [userData, loading, router]);

  if (loading) return <div>Cargando...</div>;
  if (!userData) return null;

  return (
    <AppLayout>
      <Calendar />
    </AppLayout>
  );
}