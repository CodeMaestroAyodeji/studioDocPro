'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { SalesInvoiceForm, InvoiceFormValues } from '@/components/sales-invoice-form';

export default function NewSalesInvoicePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const onSubmit = async (data: InvoiceFormValues) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/sales-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, clientId: parseInt(data.clientId, 10) }),
      });

      if (!res.ok) throw new Error('Failed to create invoice');

      toast.success('Invoice created successfully!');
      router.push('/sales-invoice');
    } catch (e) {
      console.error(e);
      toast.error('Error saving invoice');
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title="New Sales Invoice" />
      <SalesInvoiceForm onSubmit={onSubmit} />
    </div>
  );
}