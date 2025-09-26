import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../components/dashboard/Dashboard';

export default async function Home() {
  
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}
