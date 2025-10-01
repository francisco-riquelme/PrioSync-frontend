'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar } from '@/components/calendar';

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <Calendar />
    </DashboardLayout>
  );
}