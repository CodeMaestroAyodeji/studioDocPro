'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { PurchaseOrder, PurchaseOrderLineItem, Vendor } from '@prisma/client';
import { useCompanyProfile } from '@/contexts/company-profile-context';
import { formatCurrency } from '@/lib/utils';

// Define the type for the purchase order with relations
type PurchaseOrderDetails = PurchaseOrder & {
  vendor: Vendor;
  lineItems: (PurchaseOrderLineItem & { taxable: boolean })[];
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const { firebaseUser } = useAuth();
  const { state: companyProfile } = useCompanyProfile();
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

  if (loading || !companyProfile) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (!purchaseOrder) {
    return <div>Purchase Order not found</div>;
  }

  const [preparedBy, approvedBy] = companyProfile.signatories || [];

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Purchase Order ${purchaseOrder.poNumber}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end gap-2 print:hidden">
          <Link href="/purchase-order">
            <Button variant="outline">Back to PO List</Button>
          </Link>
          <Link href={`/purchase-order/edit/${id}`}>
            <Button>Edit</Button>
          </Link>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
        <Card>
          {/* Screen View */}
          <div className="print:hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <Image src={companyProfile.logoUrl} alt={`${companyProfile.name} logo`} width={150} height={70} className="object-contain" />
                      <h2 className="font-bold text-2xl mt-4">{companyProfile.name}</h2>
                      <p className="text-muted-foreground">{companyProfile.address}</p>
                      <p className="text-muted-foreground">{companyProfile.email}</p>
                      <p className="text-muted-foreground">{companyProfile.phone}</p>
                      <p className="text-muted-foreground">{companyProfile.website}</p>
                  </div>
                  <h2 className="font-bold text-3xl text-primary">Purchase Order</h2>
              </div>
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
                  <p><strong>Project:</strong> {purchaseOrder.projectName}</p>
                  <p><strong>Order Date:</strong> {format(new Date(purchaseOrder.orderDate), 'PPP')}</p>
                  {purchaseOrder.deliveryDate && <p><strong>Delivery Date:</strong> {format(new Date(purchaseOrder.deliveryDate), 'PPP')}</p>}
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
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <div className="w-1/3 text-right">
                  <p><strong>Subtotal:</strong> {formatCurrency(purchaseOrder.subtotal)}</p>
                  <p><strong>Tax (-5%):</strong> {formatCurrency(purchaseOrder.tax)}</p>
                  <p className="font-bold"><strong>Total:</strong> {formatCurrency(purchaseOrder.total)}</p>
                </div>
              </div>

              {purchaseOrder.notes && (
                <div>
                  <h3 className="font-semibold">Notes</h3>
                  <p>{purchaseOrder.notes}</p>
                </div>
              )}

              <div className="mt-12 pt-12 border-t">
                  <div className="grid grid-cols-2 gap-8">
                      {preparedBy && (
                          <div>
                              <div className="w-1/2 border-b-2 border-black my-8"></div>
                              <p className="font-semibold">Prepared by:</p>
                              <p>{preparedBy.name}</p>
                              <p className="text-sm text-muted-foreground">{preparedBy.title}</p>
                          </div>
                      )}
                      {approvedBy && (
                          <div>
                              <div className="w-1/2 border-b-2 border-black my-8"></div>
                              <p className="font-semibold">Approved by:</p>
                              <p>{approvedBy.name}</p>
                              <p className="text-sm text-muted-foreground">{approvedBy.title}</p>
                          </div>
                      )}
                  </div>
              </div>
            </CardContent>
          </div>

          {/* Print View */}
          <div className="hidden print:block p-8">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <Image src={companyProfile.logoUrl} alt={`${companyProfile.name} logo`} width={120} height={60} className="object-contain" />
                  </div>
                  <h2 className="font-bold text-5xl text-primary">Purchase Order</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between mt-8">
                <div>
                  <h3 className="font-semibold">Vendor</h3>
                  <p>{purchaseOrder.vendor.name}</p>
                  <p>{purchaseOrder.vendor.address}</p>
                  <p>{purchaseOrder.vendor.email}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <h3 className="font-semibold">PO Details</h3>
                  <p><strong>PO #:</strong> {purchaseOrder.poNumber}</p>
                  <p><strong>Project:</strong> {purchaseOrder.projectName}</p>
                  <p><strong>Order Date:</strong> {format(new Date(purchaseOrder.orderDate), 'PPP')}</p>
                  {purchaseOrder.deliveryDate && <p><strong>Delivery Date:</strong> {format(new Date(purchaseOrder.deliveryDate), 'PPP')}</p>}
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
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

              <div className="flex justify-end">
                <div className="w-1/3 text-right">
                  <p><strong>Subtotal:</strong> {formatCurrency(purchaseOrder.subtotal)}</p>
                  <p><strong>Tax (-5%):</strong> {formatCurrency(purchaseOrder.tax)}</p>
                  <p className="font-bold"><strong>Total:</strong> {formatCurrency(purchaseOrder.total)}</p>
                </div>
              </div>

              {purchaseOrder.notes && (
                <div>
                  <h3 className="font-semibold">Notes</h3>
                  <p>{purchaseOrder.notes}</p>
                </div>
              )}

              <div className="mt-12 pt-12 border-t">
                  <div className="flex justify-between">
                      {preparedBy && (
                          <div className="text-center">
                              <div className="w-[250px] border-b-2 border-black my-8"></div>
                              <p className="font-semibold">Prepared by:</p>
                              <p>{preparedBy.name}</p>
                              <p className="text-sm text-muted-foreground">{preparedBy.title}</p>
                          </div>
                      )}
                      {approvedBy && (
                          <div className="text-center">
                              <div className="w-[250px] border-b-2 border-black my-8"></div>
                              <p className="font-semibold">Approved by:</p>
                              <p>{approvedBy.name}</p>
                              <p className="text-sm text-muted-foreground">{approvedBy.title}</p>
                          </div>
                      )}
                  </div>
              </div>
            </CardContent>
            <footer className="text-center mt-8 pt-4 border-t">
                <p className="font-bold text-lg">{companyProfile.name}</p>
                <p className="text-sm text-muted-foreground">{companyProfile.address}</p>
                <p className="text-sm text-muted-foreground">{`${companyProfile.email} | ${companyProfile.phone} | ${companyProfile.website}`}</p>
            </footer>
          </div>
        </Card>
      </main>
    </div>
  );

}