'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CompanyProfileProvider } from '@/contexts/company-profile-context';
import { useAuth } from '@/contexts/auth-context';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading skeleton
  }

  if (!user) {
    router.push('/login');
    return null; // or a loading spinner
  }

  return (
    <CompanyProfileProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </CompanyProfileProvider>
  );
}
