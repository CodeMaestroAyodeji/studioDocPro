'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { Pencil } from 'lucide-react';

export default function ProfileViewPage() {
  const { state: profile } = useCompanyProfile();
  const router = useRouter();

  const DetailItem = ({ label, value }: { label: string; value: string | undefined }) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base">{value || '-'}</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Company Profile" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
            <Button onClick={() => router.push('/profile')}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
            </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>This is your company's public information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Logo</p>
              {profile.logoUrl && (
                <Image 
                  src={profile.logoUrl} 
                  alt="Company Logo"
                  width={150}
                  height={50}
                  className="rounded-md object-contain border p-1"
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem label="Company Name" value={profile.name} />
              <DetailItem label="Address" value={profile.address} />
              <DetailItem label="Email" value={profile.email} />
              <DetailItem label="Phone" value={profile.phone} />
              <DetailItem label="Website" value={profile.website} />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Signatories</CardTitle>
            <CardDescription>Authorized signatories for your documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.signatories.length > 0 ? (
              profile.signatories.map((signatory) => (
                <div key={signatory.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{signatory.name}</p>
                    <p className="text-sm text-muted-foreground">{signatory.title}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No signatories added.</p>
            )}
          </CardContent>
        </Card>
        
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>Bank accounts for payment processing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {profile.bankAccounts.length > 0 ? (
                profile.bankAccounts.map((account) => (
                    <div key={account.id} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-semibold">{account.bankName}</p>
                        <p className="text-sm text-muted-foreground">{account.accountName} - {account.accountNumber}</p>
                    </div>
                ))
             ) : (
                <p className="text-sm text-muted-foreground">No bank accounts added.</p>
             )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
