// src/app/(app)/payment-receipt/page.tsx

'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PaymentReceipt, Client } from '@prisma/client';

interface PaymentReceiptWithClient extends PaymentReceipt {
  client: Client;
}

function PaymentReceiptListPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [receipts, setReceipts] = useState<PaymentReceiptWithClient[]>([]);

  const getReceipts = useCallback(async () => {
    if (!firebaseUser) return;

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/payment-receipts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch payment receipts");
      return;
    }
    const data = await response.json();
    setReceipts(data);
  }, [firebaseUser]);

  useEffect(() => {
    getReceipts();
  }, [getReceipts]);

  const columns = [
    { accessor: 'receiptNumber', header: 'Receipt #' },
    { 
      accessor: 'client.name', 
      header: 'Client',
      cell: (value: any, item: PaymentReceiptWithClient) => item.client.name
    },
    { 
        accessor: 'paymentDate', 
        header: 'Date',
        cell: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    { 
        accessor: 'amount', 
        header: 'Amount',
        cell: (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value) 
    },
    { accessor: 'paymentMethod', header: 'Payment Method' },
  ];
  
  const searchFields: (keyof PaymentReceipt)[] = ['receiptNumber', 'paymentMethod'];

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Payment Receipts" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => router.push('/payment-receipt/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Payment Receipt
            </Button>
        </div>
        <DocumentList<PaymentReceiptWithClient>
            columns={columns}
            data={receipts}
            searchFields={searchFields}
            storageKeyPrefix="receipt_"
            viewUrlPrefix="/payment-receipt/"
            itemIdentifier="id"
            deleteUrlPrefix="/api/payment-receipts/"
            dataFetcher={getReceipts}
        />
      </main>
    </div>
  );
}

export default withAuthorization(PaymentReceiptListPage, PERMISSIONS.PAYMENT_RECEIPT_VIEW);

