'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { toast } from 'sonner';

// Define the type based on the API response
interface SalesInvoice {
  id: number;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  total: number;
  client: {
    name: string;
  };
}

function SalesInvoiceListPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInvoices = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/sales-invoices', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load invoices.');
      toast.error('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    getInvoices();
  }, [getInvoices]);

  const columns = [
    { accessor: 'invoiceNumber', header: 'Invoice #' },
    {
      accessor: 'client.name',
      header: 'Client',
      cell: (_: any, item: SalesInvoice) => item.client?.name || '-',
    },
    {
      accessor: 'issueDate',
      header: 'Date',
      cell: (value: string) => formatDate(value),
    },
    {
      accessor: 'total',
      header: 'Total (NGN)',
      cell: (value: number) => formatCurrency(value),
    },
    { accessor: 'status', header: 'Status' },
  ];

  const searchFields: (keyof SalesInvoice)[] = ['invoiceNumber', 'status'];

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Sales Invoices" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-between items-center">
          <Button onClick={() => router.push('/sales-invoice/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Sales Invoice
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={getInvoices}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading invoices...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            No invoices found yet.<br />
            <Button onClick={() => router.push('/sales-invoice/new')} className="mt-4">
              Create your first invoice
            </Button>
          </div>
        ) : (
          <DocumentList<SalesInvoice>
            columns={columns}
            data={invoices}
            searchFields={searchFields}
            storageKeyPrefix="sales-invoices"
            viewUrlPrefix="/sales-invoice/"
            itemIdentifier="id"
          />
        )}
      </main>
    </div>
  );
}

export default withAuthorization(SalesInvoiceListPage, PERMISSIONS.SALES_INVOICE_VIEW);
