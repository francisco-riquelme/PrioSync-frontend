import DashboardLayout from '@/components/layout/DashboardLayout';
import LessonDetail from '@/components/courses/LessonDetail';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return (
    <DashboardLayout>
      <LessonDetail lessonId={resolvedParams.id} />
    </DashboardLayout>
  );
}
