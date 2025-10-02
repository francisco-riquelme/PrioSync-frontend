import DashboardLayout from '@/components/layout/DashboardLayout';
import MaterialDetail from '@/components/courses/MaterialDetail';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return (
    <DashboardLayout>
      <MaterialDetail materialId={resolvedParams.id} />
    </DashboardLayout>
  );
}
