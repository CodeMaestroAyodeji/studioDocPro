'use client';

import { DocumentList } from '@/components/document-list';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';
import type { PurchaseOrder, Vendor } from '@prisma/client';
import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { purchaseOrderColumns } from '@/lib/columns';

interface PurchaseOrderWithVendor extends PurchaseOrder {
  vendor: Vendor;
}

function PurchaseOrderListPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const getPOs = useCallback(async () => {
    if (!firebaseUser) return [];

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/purchase-orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch purchase orders");
      return [];
    }
    return await response.json();
  }, [firebaseUser]);

  const columns = purchaseOrderColumns;

  const searchFields = ['poNumber'];

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
        <DocumentList<PurchaseOrderWithVendor>
            columns={columns}
            dataFetcher={getPOs}
            searchFields={searchFields}
            viewUrlPrefix="/purchase-order/"
            deleteUrlPrefix="/api/purchase-orders/"
            itemIdentifier="id"
            storageKeyPrefix="purchase-orders"
        />
      </main>
    </div>
  );
}

export default withAuthorization(PurchaseOrderListPage, PERMISSIONS.PURCHASE_ORDER_VIEW);