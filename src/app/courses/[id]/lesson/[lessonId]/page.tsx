import AppLayout from '@/components/layout/AppLayout';
import LessonDetail from '@/components/courses/LessonDetail';

export default async function LessonPage({ 
  params 
}: { 
  params: Promise<{ id: string; lessonId: string }> 
}) {
  const resolvedParams = await params;

  return (
    <AppLayout>
      <LessonDetail 
        cursoId={resolvedParams.id}
        lessonId={resolvedParams.lessonId} 
      />
    </AppLayout>
  );
}
