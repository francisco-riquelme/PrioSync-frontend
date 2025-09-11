'use client';

import ClientProviders from '../../components/layout/ClientProviders';
import DashboardLayout from '../../components/layout/DashboardLayout';
import UserProfile from '../../components/profile/UserProfile';

export default function ProfilePage() {
  return (
    <ClientProviders>
      <DashboardLayout>
        <UserProfile />
      </DashboardLayout>
    </ClientProviders>
  );
}
