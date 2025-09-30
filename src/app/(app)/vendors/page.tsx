
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import type { Vendor, VendorInvoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { getVendors } from '@/lib/vendor-utils';
import { useState, useEffect, useCallback } from 'react';

const invoiceTemplates = [
  { id: 'template-1', name: 'Classic Professional' },
  { id: 'template-2', name: 'Modern Minimalist' },
  { id: 'template-3', name: 'Bold & Creative' },
  { id: 'template-4', name: 'Elegant & Simple' },
  { id: 'template-5', name: 'Corporate Formal' },
];

export default function VendorListPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorInvoiceMap, setVendorInvoiceMap] = useState<Record<string, boolean>>({});

  const isVendorTiedToInvoice = useCallback((vendorId: string) => {
    return vendorInvoiceMap[vendorId] || false;
  }, [vendorInvoiceMap]);

  const fetchData = useCallback(() => {
    const fetchedVendors = getVendors();
    setVendors(fetchedVendors);

    const newVendorInvoiceMap: Record<string, boolean> = {};
    for (const vendor of fetchedVendors) {
        newVendorInvoiceMap[vendor.id] = false;
    }

    if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('vendor_invoice_')) {
                const item = localStorage.getItem(key);
                if (item) {
                    const invoice: VendorInvoice = JSON.parse(item);
                    if (invoice.vendorId && newVendorInvoiceMap[invoice.vendorId] !== undefined) {
                        newVendorInvoiceMap[invoice.vendorId] = true;
                    }
                }
            }
        }
    }
    setVendorInvoiceMap(newVendorInvoiceMap);
    return fetchedVendors;
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const columns = [
    { accessor: 'companyName', header: 'Company Name' },
    { accessor: 'contactName', header: 'Contact Name' },
    { accessor: 'phone', header: 'Phone' },
    { 
        accessor: 'invoiceTemplate', 
        header: 'Template Name',
        cell: (value: string) => invoiceTemplates.find(t => t.id === value)?.name || 'N/A'
    },
  ];
  
  const searchFields: (keyof Vendor)[] = ['companyName', 'contactName', 'email', 'phone'];

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Vendors" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => router.push('/vendors/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Vendor
            </Button>
        </div>
        <DocumentList
            columns={columns}
            dataFetcher={fetchData}
            searchFields={searchFields}
            storageKeyPrefix="vendor_"
            viewUrlPrefix="/vendors/"
            itemIdentifier="id"
            enableDateFilter={false}
            isDeletableCheck={isVendorTiedToInvoice}
            deleteDisabledMessage="This vendor cannot be deleted as they are tied to one or more invoices."
        />
      </main>
    </div>
  );
}
