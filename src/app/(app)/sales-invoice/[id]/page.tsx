
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { SalesInvoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

type StoredSalesInvoice = Omit<SalesInvoice, 'date' | 'dueDate'> & { date: string, dueDate: string };

const VAT_RATE = 7.5; // 7.5%

export default function SalesInvoicePreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);

  useEffect(() => {
    try {
      const storedInvoice = localStorage.getItem(`invoice_${invoiceId}`);
      if (storedInvoice) {
        const parsed: StoredSalesInvoice = JSON.parse(storedInvoice);
        setInvoice({
          ...parsed,
          date: new Date(parsed.date),
          dueDate: new Date(parsed.dueDate),
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Invoice not found',
        });
        router.push('/sales-invoice');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading Invoice',
      });
      router.push('/sales-invoice');
    }
  }, [invoiceId, router, toast]);

  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Invoice..." className="no-print" />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 text-center">
            <p>Loading invoice details...</p>
        </main>
      </div>
    );
  }
  
  const paymentAccount = companyProfile.bankAccounts.find(acc => acc.id === invoice.paymentAccountId);
  const signatory1 = companyProfile.signatories.find(s => s.id === invoice.signatory1);
  const signatory2 = companyProfile.signatories.find(s => s.id === invoice.signatory2);

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const vatAmount = invoice.applyVat ? subtotal * (VAT_RATE / 100) : 0;
    const grandTotal = subtotal + vatAmount;
    return { subtotal, vatAmount, grandTotal };
  };

  const { subtotal, vatAmount, grandTotal } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };
  
  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Invoice ${invoice.invoiceNumber}`} className="no-print" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="mb-4 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={() => router.push(`/sales-invoice/${invoiceId}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <Button onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Print or Save PDF
            </Button>
        </div>

        <DocumentPage className="sales-invoice-print">
             <header className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  {logoPlaceholder && (
                    <Image
                      src={companyProfile.logoUrl || logoPlaceholder.imageUrl}
                      alt="Company Logo"
                      width={150}
                      height={50}
                      data-ai-hint={logoPlaceholder.imageHint}
                      className="rounded-md object-contain mb-4"
                    />
                  )}
                  <p className="font-semibold">{companyProfile.name}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{companyProfile.address}</p>
                  {companyProfile.tin && <p className="text-sm text-muted-foreground">TIN: {companyProfile.tin}</p>}
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold font-headline text-primary mb-2">INVOICE</h1>
                  <div className="space-y-1 text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      <span className="font-semibold">Invoice #</span><span>{invoice.invoiceNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span className="font-semibold">Invoice Date:</span>
                      <span>{format(invoice.date, 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span className="font-semibold">Due Date:</span>
                      <span>{format(invoice.dueDate, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </div>
              </header>

              <section className="mb-8">
                  <div className="border rounded-md p-4 max-w-sm">
                      <p className="font-semibold text-muted-foreground">BILL TO</p>
                      <pre className="font-sans whitespace-pre-wrap text-sm">{invoice.billTo}</pre>
                  </div>
              </section>
              
               <section className="mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                     <TableRow>
                         <TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>
                         <TableCell className="text-right font-bold">{formatCurrency(subtotal)}</TableCell>
                     </TableRow>
                     {invoice.applyVat && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-semibold">VAT ({VAT_RATE}%)</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(vatAmount)}</TableCell>
                        </TableRow>
                     )}
                     <TableRow className="text-lg">
                         <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                         <TableCell className="text-right font-bold text-primary">{formatCurrency(grandTotal)}</TableCell>
                     </TableRow>
                  </TableFooter>
                </Table>
              </section>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-4">
                    {invoice.notes && (
                        <div>
                            <h3 className="font-semibold text-sm">Notes / Terms</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    )}
                     {paymentAccount && (
                        <div>
                            <h3 className="font-semibold text-sm">Payment Details</h3>
                            <div className="text-sm text-muted-foreground">
                                <p>Bank: {paymentAccount.bankName}</p>
                                <p>Account Name: {paymentAccount.accountName}</p>
                                <p>Account Number: {paymentAccount.accountNumber}</p>
                            </div>
                        </div>
                    )}
                </div>
             </section>
              
            <footer className="space-y-4">
                 <div className="grid grid-cols-2 gap-8 pt-8">
                    <div className="text-center">
                        <div className="h-12"></div>
                        <div className="border-b border-foreground w-2/3 mx-auto"></div>
                        <p className="font-semibold mt-2">{signatory1?.name}</p>
                        <p className="text-sm text-muted-foreground">{signatory1?.title}</p>
                    </div>
                    <div className="text-center">
                        <div className="h-12"></div>
                        <div className="border-b border-foreground w-2/3 mx-auto"></div>
                        <p className="font-semibold mt-2">{signatory2?.name}</p>
                        <p className="text-sm text-muted-foreground">{signatory2?.title}</p>
                    </div>
                 </div>
                 <div className="text-center text-xs text-muted-foreground pt-12">
                    <p>{companyProfile.phone} | {companyProfile.email} | {companyProfile.website}</p>
                </div>
            </footer>
        </DocumentPage>
      </main>
    </div>
  );
}
