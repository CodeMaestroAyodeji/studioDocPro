
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { SalesInvoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';

type StoredSalesInvoice = Omit<SalesInvoice, 'date' | 'dueDate'> & { date: string; dueDate: string };

const getInvoices = (): SalesInvoice[] => {
  if (typeof window === 'undefined') return [];
  const invoices: SalesInvoice[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('invoice_')) {
      const item = localStorage.getItem(key);
      if (item) {
        const storedInvoice: StoredSalesInvoice = JSON.parse(item);
        invoices.push({
            ...storedInvoice,
            date: new Date(storedInvoice.date),
            dueDate: new Date(storedInvoice.dueDate),
        });
      }
    }
  }
  return invoices.sort((a, b) => b.date.getTime() - a.date.getTime());
};

function SalesInvoiceListPage() {
  const router = useRouter();

  const columns = [
    { accessor: 'invoiceNumber', header: 'Invoice #' },
    { accessor: 'billTo', header: 'Bill To' },
    { 
        accessor: 'date', 
        header: 'Date',
        cell: (value: Date) => format(value, 'dd/MM/yyyy'),
    },
    { 
        accessor: 'dueDate', 
        header: 'Due Date',
        cell: (value: Date) => format(value, 'dd/MM/yyyy'),
    },
  ];
  
  // const searchFields = ['invoiceNumber', 'billTo'];

  const searchFields: (keyof SalesInvoice)[] = [
  'invoiceNumber',
  'billTo',
];


  return (
    <div className="flex flex-1 flex-col">
      <Header title="Sales Invoices" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => router.push('/sales-invoice/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Sales Invoice
            </Button>
        </div>
        <DocumentList
            columns={columns}
            dataFetcher={getInvoices}
            searchFields={searchFields}
            storageKeyPrefix="invoice_"
            viewUrlPrefix="/sales-invoice/"
            itemIdentifier="invoiceNumber"
        />
      </main>
    </div>
  );
}

export default withAuthorization(SalesInvoiceListPage, PERMISSIONS.SALES_INVOICE_VIEW);

