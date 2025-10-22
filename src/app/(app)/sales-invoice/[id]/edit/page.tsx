'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { SalesInvoiceForm, InvoiceFormValues } from '@/components/sales-invoice-form';
import { SalesInvoice, InvoiceLineItem, Client } from '@prisma/client';

interface FullSalesInvoice extends SalesInvoice {
  client: Client;
  lineItems: InvoiceLineItem[];
  discount?: number;
  addVat?: boolean;
  preparedById?: string;
  approvedById?: string;
  bankAccountId?: string;
}

export default function EditSalesInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { firebaseUser } = useAuth();
  const [invoice, setInvoice] = useState<FullSalesInvoice | null>(null);
  const invoiceId = params.id as string;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/sales-invoices/${invoiceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch invoice');
        const data: FullSalesInvoice = await response.json();
        setInvoice(data);
      } catch (error) {
        toast.error('Could not fetch invoice data.');
      }
    };

    if (firebaseUser && invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, firebaseUser]);

  const onSubmit = async (values: InvoiceFormValues) => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/sales-invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...values, clientId: parseInt(values.clientId, 10) }),
      });

      if (!response.ok) throw new Error('Failed to update invoice');

      const updatedInvoice = await response.json();
      toast.success(`Invoice ${updatedInvoice.invoiceNumber} has been updated.`);
      router.push(`/sales-invoice/${updatedInvoice.id}`);
    } catch (error) {
      toast.error('Could not update the invoice.');
    }
  };

  if (!invoice) return <div>Loading...</div>;

  const initialValues = {
    ...invoice,
    issueDate: new Date(invoice.issueDate),
    clientId: String(invoice.clientId),
    notes: invoice.notes || '',
    discount: invoice.discount || 0,
    addVat: invoice.addVat || false,
    preparedById: invoice.preparedById || '',
    approvedById: invoice.approvedById || '',
    bankAccountId: invoice.bankAccountId || '',
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Edit Sales Invoice #${invoice.invoiceNumber}`} />
      <SalesInvoiceForm onSubmit={onSubmit} initialValues={initialValues} isEditing />
    </div>
  );
}
