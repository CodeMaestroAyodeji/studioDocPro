import type { ReactNode } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CompanyProfileProvider } from '@/contexts/company-profile-context';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CompanyProfileProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </CompanyProfileProvider>
  );
}
