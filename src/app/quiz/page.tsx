'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import AppLayout from '@/components/layout/AppLayout';
import Quiz from '@/components/quiz/Quiz';
import FullScreenLoader from '@/components/common/FullScreenLoader';

export default function QuizPage() {
  const { userData, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cuestionarioId = searchParams.get('cuestionarioId') || undefined;
  const cursoId = searchParams.get('cursoId') || undefined;

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/');
    }
  }, [userData, loading, router]);

  if (loading) return <FullScreenLoader />;
  if (!userData) return null;

  return (
    <AppLayout>
      <Quiz 
        cuestionarioId={cuestionarioId}
        cursoId={cursoId}
      />
    </AppLayout>
  );
}