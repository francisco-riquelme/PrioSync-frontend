import AppLayout from '@/components/layout/AppLayout';
import CourseDetail from '@/components/courses/CourseDetail';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return (
    <AppLayout>
      <CourseDetail courseId={resolvedParams.id} />
    </AppLayout>
  );
}