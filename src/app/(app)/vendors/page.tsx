
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { getVendors } from '@/lib/vendor-utils';


export default function VendorListPage() {
  const router = useRouter();

  const columns = [
    { accessor: 'companyName', header: 'Company Name' },
    { accessor: 'contactName', header: 'Contact Name' },
    { accessor: 'phone', header: 'Phone' },
    { accessor: 'email', header: 'Email' },
  ];
  
  const searchFields = ['companyName', 'contactName', 'email', 'phone'];

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
            dataFetcher={getVendors}
            searchFields={searchFields}
            storageKeyPrefix="vendor_"
            viewUrlPrefix="/vendors/"
            itemIdentifier="id"
            enableDateFilter={false}
        />
      </main>
    </div>
  );
}
