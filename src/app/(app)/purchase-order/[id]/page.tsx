
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { PurchaseOrder, PurchaseOrderLineItem, Vendor } from '@prisma/client';

// Define the type for the purchase order with relations
type PurchaseOrderDetails = PurchaseOrder & {
  vendor: Vendor;
  lineItems: PurchaseOrderLineItem[];
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const { firebaseUser } = useAuth();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id;

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (!firebaseUser || !id) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/purchase-orders/${id}` , {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseOrder(data);
      } else {
        console.error('Failed to fetch purchase order');
      }
      setLoading(false);
    };

    fetchPurchaseOrder();
  }, [firebaseUser, id]);

  if (loading) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (!purchaseOrder) {
    return <div>Purchase Order not found</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Purchase Order ${purchaseOrder.poNumber}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Vendor</h3>
                <p>{purchaseOrder.vendor.name}</p>
                <p>{purchaseOrder.vendor.address}</p>
                <p>{purchaseOrder.vendor.email}</p>
              </div>
              <div>
                <h3 className="font-semibold">PO Details</h3>
                <p><strong>PO #:</strong> {purchaseOrder.poNumber}</p>
                <p><strong>Order Date:</strong> {format(new Date(purchaseOrder.orderDate), 'PPP')}</p>
                {purchaseOrder.deliveryDate && <p><strong>Delivery Date:</strong> {format(new Date(purchaseOrder.deliveryDate), 'PPP')}</p>}
                <p><strong>Status:</strong> {purchaseOrder.status}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <div className="w-1/3 text-right">
                <p><strong>Subtotal:</strong> {purchaseOrder.subtotal.toFixed(2)}</p>
                <p><strong>Tax (10%):</strong> {purchaseOrder.tax.toFixed(2)}</p>
                <p className="font-bold"><strong>Total:</strong> {purchaseOrder.total.toFixed(2)}</p>
              </div>
            </div>

            {purchaseOrder.notes && (
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p>{purchaseOrder.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
