'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';
import { useAuth } from '@/contexts/auth-context';
import { useCallback } from 'react';
import type { PaymentVoucher } from '@prisma/client';

function PaymentVoucherListPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const getVouchers = useCallback(async () => {
    if (!firebaseUser) return [];

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/payment-vouchers', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch payment vouchers");
      return [];
    }
    return await response.json();
  }, [firebaseUser]);

  const columns = [
    { accessor: 'voucherNumber', header: 'Voucher #' },
    { accessor: 'payeeName', header: 'Payee Name' },
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
  ];
  
  const searchFields = [
  'voucherNumber',
  'payeeName',
  'description',
];


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
        <DocumentList<PaymentVoucher>
            columns={columns}
            dataFetcher={getVouchers}
            searchFields={searchFields}
            storageKeyPrefix="voucher_"
            viewUrlPrefix="/payment-voucher/"
            deleteUrlPrefix="/api/payment-vouchers/"
            itemIdentifier="id"
        />
      </main>
    </div>
  );
}

export default withAuthorization(PaymentVoucherListPage, PERMISSIONS.PAYMENT_VOUCHER_VIEW);