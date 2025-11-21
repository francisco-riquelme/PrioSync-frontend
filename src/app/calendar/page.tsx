'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
import { Calendar } from '@/components/calendar';
import FullScreenLoader from '@/components/common/FullScreenLoader';

export default function CalendarPage() {
  const { userData, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/');
    }
  }, [userData, loading, router]);

  if (loading) return <FullScreenLoader />;
  if (!userData) return null;

  return (
    <AppLayout>
      <Calendar />
    </AppLayout>
  );
}