'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AppLayout from '../../components/layout/AppLayout';
import Dashboard from '../../components/dashboard/Dashboard';

export default function DashboardPage() {
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
      <Dashboard />
    </AppLayout>
  );
}