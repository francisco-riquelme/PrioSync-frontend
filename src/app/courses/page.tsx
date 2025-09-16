import DashboardLayout from '@/components/layout/DashboardLayout';
import CoursesList from '@/components/courses/CoursesList';

export default function CursosPage() {
  return (
    <DashboardLayout>
      <CoursesList />
    </DashboardLayout>
  );
}