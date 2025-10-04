'use client';

import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Quiz from '@/components/quiz/Quiz';

export default function QuizPage() {
  const searchParams = useSearchParams();
  const cuestionarioId = searchParams.get('cuestionarioId') || undefined;
  const cursoId = searchParams.get('cursoId') || undefined;

  return (
    <DashboardLayout>
      <Quiz 
        cuestionarioId={cuestionarioId}
        cursoId={cursoId}
      />
    </DashboardLayout>
  );
}