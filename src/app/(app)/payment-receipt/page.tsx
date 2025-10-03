
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { PaymentReceipt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

type StoredPaymentReceipt = Omit<PaymentReceipt, 'date'> & { date: string };

const getReceipts = (): PaymentReceipt[] => {
  if (typeof window === 'undefined') return [];
  const receipts: PaymentReceipt[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('receipt_')) {
      const item = localStorage.getItem(key);
      if (item) {
        const storedReceipt: StoredPaymentReceipt = JSON.parse(item);
        receipts.push({
            ...storedReceipt,
            date: new Date(storedReceipt.date),
        });
      }
    }
  }
  return receipts.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export default function PaymentReceiptListPage() {
  const router = useRouter();

  const columns = [
    { accessor: 'receiptNumber', header: 'Receipt #' },
    { accessor: 'receivedFrom', header: 'Received From' },
    { 
        accessor: 'date', 
        header: 'Date',
        cell: (value: Date) => format(value, 'dd/MM/yyyy'),
    },
    { 
        accessor: 'amountReceived', 
        header: 'Amount',
        cell: (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value) 
    },
    { accessor: 'paymentType', header: 'Payment Type' },
  ];
  
  // const searchFields = ['receiptNumber', 'receivedFrom', 'relatedInvoiceNumber'];

  const searchFields: (keyof PaymentReceipt)[] = [
  'receiptNumber',
  'receivedFrom',
  'relatedInvoiceNumber',
];


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
        <DocumentList
            columns={columns}
            dataFetcher={getReceipts}
            searchFields={searchFields}
            storageKeyPrefix="receipt_"
            viewUrlPrefix="/payment-receipt/"
            itemIdentifier="receiptNumber"
        />
      </main>
    </div>
  );
}
