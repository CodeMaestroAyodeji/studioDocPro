'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import type { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';
import { useAuth } from '@/contexts/auth-context';

const invoiceTemplates = [
  { id: 'template-1', name: 'Classic Professional' },
  { id: 'template-2', name: 'Modern Minimalist' },
  { id: 'template-3', name: 'Bold & Creative' },
  { id: 'template-4', name: 'Elegant & Simple' },
  { id: 'template-5', name: 'Corporate Formal' },
];

function VendorListPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const getVendors = useCallback(async () => {
    if (!firebaseUser) return;

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/vendors', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch vendors");
      return;
    }
    const data = await response.json();
    setVendors(data);
  }, [firebaseUser]);

  useEffect(() => {
    getVendors();
  }, [getVendors]);


  const columns = [
    { accessor: 'companyName', header: 'Company Name' },
    { accessor: 'contactName', header: 'Contact Name' },
    { accessor: 'phone', header: 'Phone' },
    { accessor: 'website', header: 'Website' },
    { accessor: 'tin', header: 'TIN' },
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
            data={vendors}
            searchFields={searchFields}
            storageKeyPrefix="vendor_"
            viewUrlPrefix="/vendors/"
            deleteUrlPrefix="/api/vendors/"
            itemIdentifier="id"
            enableDateFilter={false}
        />
      </main>
    </div>
  );
}

export default withAuthorization(VendorListPage, PERMISSIONS.VENDOR_VIEW);