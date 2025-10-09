
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';
import { useAuth } from '@/contexts/auth-context';
import { VendorInvoice, Vendor } from '@prisma/client';

interface VendorInvoiceWithVendor extends VendorInvoice {
  vendor: Vendor;
}

function VendorInvoiceListPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [invoices, setInvoices] = useState<VendorInvoiceWithVendor[]>([]);

  const getVendorInvoices = useCallback(async () => {
    if (!firebaseUser) return;

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/vendor-invoices', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch vendor invoices");
      return;
    }
    const data = await response.json();
    setInvoices(data);
  }, [firebaseUser]);

  useEffect(() => {
    getVendorInvoices();
  }, [getVendorInvoices]);

  const columns = [
    { accessor: 'invoiceNumber', header: 'Invoice #' },
    { 
      accessor: 'vendor.name', 
      header: 'Vendor',
      cell: (value: any, item: VendorInvoiceWithVendor) => item.vendor.name
    },
    { 
        accessor: 'invoiceDate', 
        header: 'Date',
        cell: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
    },
    { 
        accessor: 'total', 
        header: 'Amount',
        cell: (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value || 0),
    },
    { accessor: 'status', header: 'Status' },
  ];
  
  const searchFields: (keyof VendorInvoice)[] = ['invoiceNumber', 'status'];

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Vendor Invoices" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => router.push('/vendor-invoice/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Vendor Invoice
            </Button>
        </div>
        <DocumentList<VendorInvoiceWithVendor>
            columns={columns}
            data={invoices}
            searchFields={searchFields}
            storageKeyPrefix="vendor_invoice_"
            viewUrlPrefix="/vendor-invoice/"
            itemIdentifier="id"
        />
      </main>
    </div>
  );
}

export default withAuthorization(VendorInvoiceListPage, PERMISSIONS.VENDOR_INVOICE_VIEW);

