'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Vendor } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react';

const DetailRow = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <div className="flex items-start py-2">
        <p className="text-sm text-muted-foreground font-semibold w-32 shrink-0">{label}</p>
        <p className="font-medium text-left break-words">{value || 'N/A'}</p>
    </div>
);

export default function VendorViewPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (!firebaseUser || !vendorId) return;

    const fetchVendor = async () => {
      const token = await firebaseUser.getIdToken();
      try {
        const response = await fetch(`/api/vendors/${vendorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch vendor');
        }
        const data = await response.json();
        setVendor(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error loading vendor' });
        router.push('/vendors');
      }
    };

    fetchVendor();
  }, [vendorId, router, toast, firebaseUser]);

  const handleDelete = async () => {
    if (!firebaseUser || !vendorId) return;

    if (!confirm('Are you sure you want to delete this vendor?')) {
        return;
    }

    const token = await firebaseUser.getIdToken();

    try {
        const response = await fetch(`/api/vendors/${vendorId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete vendor');
        }

        toast({
            title: 'Vendor Deleted',
            description: `Vendor "${vendor?.name}" has been deleted.`,
        });
        router.push('/vendors');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Deleting Vendor',
            description: 'Could not delete the vendor. Please try again.',
        });
    }
  };

  if (!vendor) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Vendor..." />
        <main className="flex-1 p-6 text-center"><p>Loading vendor details...</p></main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={vendor.name} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/vendors')}><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Button>
            <Button variant="outline" onClick={() => router.push(`/vendors/${vendorId}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
        </div>
        <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Vendor Details</h2>
            <DetailRow label="Company Name" value={vendor.name} />
            <DetailRow label="Contact Name" value={vendor.contactName} />
            <DetailRow label="Email" value={vendor.email} />
            <DetailRow label="Phone" value={vendor.phone} />
            <DetailRow label="Address" value={vendor.address} />
        </div>
      </main>
    </div>
  );
}