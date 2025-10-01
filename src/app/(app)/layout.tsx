
'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CompanyProfileProvider } from '@/contexts/company-profile-context';
import { useAuth } from '@/contexts/auth-context';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <CompanyProfileProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </CompanyProfileProvider>
  );
}
