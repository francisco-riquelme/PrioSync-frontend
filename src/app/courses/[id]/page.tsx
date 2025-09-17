import DashboardLayout from '@/components/layout/DashboardLayout';
import CourseDetail from '@/components/courses/CourseDetail';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return (
    <DashboardLayout>
      <CourseDetail courseId={resolvedParams.id} />
    </DashboardLayout>
  );
}