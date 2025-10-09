
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

// Define the type based on the API response
interface SalesInvoice {
  id: number;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  client: {
    name: string;
  };
}

function SalesInvoiceListPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);

  const getInvoices = useCallback(async () => {
    if (!firebaseUser) return;

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/sales-invoices', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Handle error
      console.error("Failed to fetch invoices");
      return [];
    }
    const invoices = await response.json();
    setInvoices(invoices);
  }, [firebaseUser]);

  useEffect(() => {
    getInvoices();
  }, [getInvoices]);

  const columns = [
    { accessor: 'invoiceNumber', header: 'Invoice #' },
    { 
      accessor: 'client.name', 
      header: 'Client',
      cell: (value: any, item: SalesInvoice) => item.client.name
    },
    { 
        accessor: 'issueDate', 
        header: 'Date',
        cell: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    { 
        accessor: 'dueDate', 
        header: 'Due Date',
        cell: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    { accessor: 'total', header: 'Total' },
    { accessor: 'status', header: 'Status' },
  ];
  
  const searchFields: (keyof SalesInvoice)[] = ['invoiceNumber', 'status'];

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
        <DocumentList<SalesInvoice>
            columns={columns}
            data={invoices}
            searchFields={searchFields}
            viewUrlPrefix="/sales-invoice/"
            itemIdentifier="id"
        />
      </main>
    </div>
  );
}

export default withAuthorization(SalesInvoiceListPage, PERMISSIONS.SALES_INVOICE_VIEW);

