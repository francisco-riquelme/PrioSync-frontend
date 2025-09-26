import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../components/dashboard/Dashboard';
import { initializeDB } from '@/utils/api/api';

export default async function Home() {
  await initializeDB()
  
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}
