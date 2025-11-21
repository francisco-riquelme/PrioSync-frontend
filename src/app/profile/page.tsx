'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { CircularProgress, Box } from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import UserProfile from '../../components/profile/UserProfile';
import FullScreenLoader from '@/components/common/FullScreenLoader';

export default function ProfilePage() {
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
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      }>
        <UserProfile />
      </Suspense>
    </AppLayout>
  );
}