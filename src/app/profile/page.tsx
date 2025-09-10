'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '../../theme/theme';
import DashboardLayout from '../../components/layout/DashboardLayout';
import UserProfile from '../../components/profile/UserProfile';

export default function ProfilePage() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DashboardLayout>
        <UserProfile />
      </DashboardLayout>
    </ThemeProvider>
  );
}
