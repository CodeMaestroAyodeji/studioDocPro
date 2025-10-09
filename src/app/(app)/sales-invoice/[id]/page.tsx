'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { SalesInvoice, InvoiceLineItem, Client } from '@prisma/client';

// Define the type for the invoice with relations
type InvoiceDetails = SalesInvoice & {
  client: Client;
  lineItems: InvoiceLineItem[];
};

export default function SalesInvoiceDetailPage() {
  const params = useParams();
  const { firebaseUser } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!firebaseUser || !id) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/sales-invoices/${id}` , {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        console.error('Failed to fetch invoice');
      }
      setLoading(false);
    };

    fetchInvoice();
  }, [firebaseUser, id]);

  if (loading) {
    return <div>Loading...</div>; // Or a skeleton loader
  }

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Invoice ${invoice.invoiceNumber}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sales Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Billed To</h3>
                <p>{invoice.client.name}</p>
                <p>{invoice.client.address}</p>
                <p>{invoice.client.email}</p>
              </div>
              <div>
                <h3 className="font-semibold">Invoice Details</h3>
                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Issue Date:</strong> {format(new Date(invoice.issueDate), 'PPP')}</p>
                <p><strong>Due Date:</strong> {format(new Date(invoice.dueDate), 'PPP')}</p>
                <p><strong>Status:</strong> {invoice.status}</p>
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
                {invoice.lineItems.map((item) => (
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
                <p><strong>Subtotal:</strong> {invoice.subtotal.toFixed(2)}</p>
                <p><strong>Tax (10%):</strong> {invoice.tax.toFixed(2)}</p>
                <p className="font-bold"><strong>Total:</strong> {invoice.total.toFixed(2)}</p>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p>{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}