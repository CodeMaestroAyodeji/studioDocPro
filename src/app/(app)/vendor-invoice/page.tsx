
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import type { VendorInvoice, Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getVendors } from '@/lib/vendor-utils';
import { useState, useEffect } from 'react';

type StoredVendorInvoice = Omit<VendorInvoice, 'invoiceDate' | 'dueDate'> & { invoiceDate: string; dueDate: string };

const getVendorInvoices = (): (VendorInvoice & { vendorName?: string })[] => {
  if (typeof window === 'undefined') return [];
  
  const vendors = getVendors();
  const vendorMap = new Map(vendors.map(v => [v.id, v.companyName]));
  
  const invoices: (VendorInvoice & { vendorName?: string })[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('vendor_invoice_')) {
      const item = localStorage.getItem(key);
      if (item) {
        const storedInvoice: StoredVendorInvoice = JSON.parse(item);
        invoices.push({
            ...storedInvoice,
            invoiceDate: new Date(storedInvoice.invoiceDate),
            dueDate: new Date(storedInvoice.dueDate),
            vendorName: vendorMap.get(storedInvoice.vendorId) || 'Unknown Vendor',
        });
      }
    }
  }
  return invoices.sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime());
};

export default function VendorInvoiceListPage() {
  const router = useRouter();

  const columns = [
    { accessor: 'invoiceNumber', header: 'Invoice #' },
    { accessor: 'vendorName', header: 'Vendor' },
    { accessor: 'projectName', header: 'Project' },
    { 
        accessor: 'invoiceDate', 
        header: 'Date',
        cell: (value: Date) => format(value, 'dd/MM/yyyy'),
    },
    { 
        accessor: 'dueDate', 
        header: 'Due Date',
        cell: (value: Date) => format(value, 'dd/MM/yyyy'),
    },
  ];
  
  const searchFields = ['invoiceNumber', 'vendorName', 'projectName'];

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
        <DocumentList
            columns={columns}
            dataFetcher={getVendorInvoices}
            searchFields={searchFields}
            storageKeyPrefix="vendor_invoice_"
            viewUrlPrefix="/vendor-invoice/"
            itemIdentifier="id"
        />
      </main>
    </div>
  );
}

