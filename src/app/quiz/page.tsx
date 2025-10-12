'use client';

import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Quiz from '@/components/quiz/Quiz';

export default function QuizPage() {
  const searchParams = useSearchParams();
  const cuestionarioId = searchParams.get('cuestionarioId') || undefined;
  const cursoId = searchParams.get('cursoId') || undefined;

  return (
    <AppLayout>
      <Quiz 
        cuestionarioId={cuestionarioId}
        cursoId={cursoId}
      />
    </AppLayout>
  );
}