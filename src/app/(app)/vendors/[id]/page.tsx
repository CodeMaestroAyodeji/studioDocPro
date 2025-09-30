
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Pencil } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import type { Vendor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateAvatar } from '@/lib/vendor-utils';

const invoiceTemplates = [
  { id: 'template-1', name: 'Classic Professional' },
  { id: 'template-2', name: 'Modern Minimalist' },
  { id: 'template-3', name: 'Bold & Creative' },
  { id: 'template-4', name: 'Elegant & Simple' },
  { id: 'template-5', name: 'Corporate Formal' },
];

export default function VendorViewPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
  const { toast } = useToast();
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            const storedVendor = localStorage.getItem(`vendor_${vendorId}`);
            if (storedVendor) {
                setVendor(JSON.parse(storedVendor));
            } else {
                toast({ variant: 'destructive', title: 'Vendor not found' });
                router.push('/vendors');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error loading vendor' });
            router.push('/vendors');
        }
    }
  }, [vendorId, router, toast]);

  const DetailItem = ({ label, value }: { label: string; value: string | undefined }) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base break-words">{value || '-'}</p>
    </div>
  );
  
  const logoPreview = useMemo(() => {
    if (!vendor) return '';
    return vendor.logoUrl || generateAvatar(vendor.companyName);
  }, [vendor]);

  if (!vendor) {
    return (
        <div className="flex flex-1 flex-col">
            <Header title="Loading..." />
            <main className="flex-1 p-6 text-center"><p>Loading vendor data...</p></main>
        </div>
    );
  }
  
  const templateName = invoiceTemplates.find(t => t.id === vendor.invoiceTemplate)?.name || 'Unknown Template';

  return (
    <div className="flex flex-1 flex-col">
      <Header title={vendor.companyName} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
            <Button onClick={() => router.push(`/vendors/${vendorId}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Vendor
            </Button>
        </div>
        
        <div className="grid gap-8">
            <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl">{vendor.companyName}</CardTitle>
                        <CardDescription>Contact: {vendor.contactName}</CardDescription>
                    </div>
                     {logoPreview && (
                        <Image 
                        src={logoPreview} 
                        alt="Vendor Logo"
                        width={80}
                        height={80}
                        className="rounded-md object-cover border p-1"
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem label="Phone" value={vendor.phone} />
                    <DetailItem label="Email" value={vendor.email} />
                    <DetailItem label="Website" value={vendor.website} />
                    <DetailItem label="TIN" value={vendor.tin} />
                </div>
                 <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-base whitespace-pre-wrap">{vendor.address || '-'}</p>
                </div>
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailItem label="Bank Name" value={vendor.bankName} />
                <DetailItem label="Account Name" value={vendor.accountName} />
                <DetailItem label="Account Number" value={vendor.accountNumber} />
            </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <DetailItem label="Assigned Invoice Template" value={templateName} />
            </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
