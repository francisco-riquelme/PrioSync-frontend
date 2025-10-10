import AppLayout from '@/components/layout/AppLayout';
import MaterialDetail from '@/components/courses/MaterialDetail';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return (
    <AppLayout>
      <MaterialDetail materialId={resolvedParams.id} />
    </AppLayout>
  );
}
