'use client';

import ClientProviders from '../components/layout/ClientProviders';
import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../components/dashboard/Dashboard';

export default function Home() {
  return (
    <ClientProviders>
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    </ClientProviders>
  );
}
