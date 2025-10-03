
'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { PurchaseOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

type StoredPurchaseOrder = Omit<PurchaseOrder, 'date'> & { date: string };

const getPOs = (): PurchaseOrder[] => {
  if (typeof window === 'undefined') return [];
  const pos: PurchaseOrder[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('po_')) {
      const item = localStorage.getItem(key);
      if (item) {
        const storedPo: StoredPurchaseOrder = JSON.parse(item);
        pos.push({
            ...storedPo,
            date: new Date(storedPo.date),
        });
      }
    }
  }
  return pos.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export default function PurchaseOrderListPage() {
  const router = useRouter();

  const columns = [
    { accessor: 'poNumber', header: 'PO #' },
    { accessor: 'vendor', header: 'Vendor' },
    { accessor: 'projectName', header: 'Project Name' },
    { 
        accessor: 'date', 
        header: 'Date',
        cell: (value: Date) => format(value.toString(), 'dd/MM/yyyy'),
    },
  ];
  
  const searchFields: (keyof PurchaseOrder)[] = [
  'poNumber',
  'vendor',
  'projectName',
];

  

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Purchase Orders" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end">
            <Button onClick={() => router.push('/purchase-order/new')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Purchase Order
            </Button>
        </div>
        <DocumentList
            columns={columns}
            dataFetcher={getPOs}
            searchFields={searchFields}
            storageKeyPrefix="po_"
            viewUrlPrefix="/purchase-order/"
        />
      </main>
    </div>
  );
}
