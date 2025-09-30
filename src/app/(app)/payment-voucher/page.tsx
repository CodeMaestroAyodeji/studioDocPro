
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { PaymentVoucher } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

type StoredPaymentVoucher = Omit<PaymentVoucher, 'date'> & { date: string };

const getVouchers = (): PaymentVoucher[] => {
  if (typeof window === 'undefined') return [];
  const vouchers: PaymentVoucher[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('voucher_')) {
      const item = localStorage.getItem(key);
      if (item) {
        const storedVoucher: StoredPaymentVoucher = JSON.parse(item);
        vouchers.push({
            ...storedVoucher,
            date: new Date(storedVoucher.date),
        });
      }
    }
  }
  return vouchers.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export default function PaymentVoucherListPage() {
  const router = useRouter();

  const columns = [
    { accessor: 'voucherNumber', header: 'Voucher #' },
    { accessor: 'payeeName', header: 'Payee Name' },
    { 
        accessor: 'date', 
        header: 'Date',
        cell: (value: Date) => format(value, 'dd/MM/yyyy'),
    },
    { 
        accessor: 'amount', 
        header: 'Amount',
        cell: (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value) 
    },
  ];
  
  const searchFields = ['voucherNumber', 'payeeName', 'description'];

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Payment Vouchers" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => router.push('/payment-voucher/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Payment Voucher
            </Button>
        </div>
        <DocumentList
            columns={columns}
            dataFetcher={getVouchers}
            searchFields={searchFields}
            storageKeyPrefix="voucher_"
            viewUrlPrefix="/payment-voucher/"
        />
      </main>
    </div>
  );
}
