
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
import { numberToWords } from '@/lib/number-to-words';
import type { PaymentReceipt } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type StoredPaymentReceipt = Omit<PaymentReceipt, 'date'> & { date: string };

const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => (
    <div className="grid grid-cols-2 gap-4 items-start py-2">
        <p className="text-sm text-muted-foreground font-semibold">{label}</p>
        <p className="font-medium">{value || '-'}</p>
    </div>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export default function PaymentReceiptPreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  useEffect(() => {
    try {
      const storedReceipt = localStorage.getItem(`receipt_${receiptId}`);
      if (storedReceipt) {
        const parsed: StoredPaymentReceipt = JSON.parse(storedReceipt);
        setReceipt({
          ...parsed,
          date: new Date(parsed.date),
        });
      } else {
        toast({ variant: 'destructive', title: 'Receipt not found' });
        router.push('/payment-receipt');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading receipt' });
      router.push('/payment-receipt');
    }
  }, [receiptId, router, toast]);

  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');

  if (!receipt) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Receipt..." className="no-print" />
        <main className="flex-1 p-6 text-center"><p>Loading receipt details...</p></main>
      </div>
    );
  }

  const issuedBy = companyProfile.signatories.find(s => s.id === receipt.issuedBy);
  const receivingBank = companyProfile.bankAccounts.find(b => b.id === receipt.receivingBankId);
  const amountInWords = numberToWords(receipt.amountReceived);

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Receipt ${receipt.receiptNumber}`} className="no-print" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="mb-4 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={() => router.push(`/payment-receipt/${receiptId}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
            <Button onClick={() => window.print()}><Download className="mr-2 h-4 w-4" />Print or Save PDF</Button>
        </div>

        <DocumentPage>
             <header className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                   {logoPlaceholder && (
                    <Image
                      src={companyProfile.logoUrl || logoPlaceholder.imageUrl}
                      alt="Company Logo"
                      width={80}
                      height={80}
                      data-ai-hint={logoPlaceholder.imageHint}
                      className="rounded-md object-contain"
                    />
                  )}
                   <div>
                        <h1 className="text-2xl font-bold font-headline text-primary">{companyProfile.name}</h1>
                        <p className="text-xs text-muted-foreground max-w-xs">{companyProfile.address}</p>
                        <p className="text-xs text-muted-foreground">{companyProfile.phone} | {companyProfile.email}</p>
                   </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold font-headline">RECEIPT</h2>
                  <p className="text-sm">No: <span className="font-semibold">{receipt.receiptNumber}</span></p>
                  <p className="text-sm">Date: <span className="font-semibold">{format(receipt.date, 'dd MMMM, yyyy')}</span></p>
                </div>
              </header>

              <Separator className="my-8"/>

              <div className="space-y-6 mb-12 text-base">
                 <div className="flex items-baseline gap-2">
                    <p className="text-muted-foreground">Received from:</p>
                    <p className="font-bold text-lg border-b border-dashed flex-1 pb-1">{receipt.receivedFrom}</p>
                    <p className="text-muted-foreground">the sum of</p>
                    <p className="font-bold text-lg border-b border-dashed flex-1 pb-1">{formatCurrency(receipt.amountReceived)}</p>
                 </div>
                 
                 <div className="flex items-baseline gap-2">
                    <p className="text-muted-foreground">Amount in Words:</p>
                    <p className="font-bold text-lg capitalize border-b border-dashed flex-1 pb-1">{amountInWords}</p>
                 </div>

                <div className="flex items-baseline gap-2">
                    <p className="text-muted-foreground">Being payment for:</p>
                    <p className="font-bold text-lg border-b border-dashed flex-1 pb-1">{receipt.notes || '-'}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-x-8 gap-y-2 pt-6">
                    <DetailRow label="Payment Method" value={receipt.paymentMethod} />
                    <DetailRow label="Related Invoice #" value={receipt.relatedInvoiceNumber} />
                     {receivingBank && <DetailRow label="Receiving Bank" value={`${receivingBank.bankName} - ${receivingBank.accountNumber}`} />}
                    <DetailRow label="Payment Type" value={receipt.paymentType} />
                    <div className="col-span-2 bg-primary/10 p-4 rounded-md text-center mt-4">
                        <p className="text-sm text-primary font-semibold">AMOUNT IN FIGURES</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(receipt.amountReceived)}</p>
                    </div>
                 </div>

                 {receipt.paymentType === 'Part Payment' && (
                    <>
                        <Separator className="my-6 bg-border" />
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <DetailRow label="Total Invoice Amount" value={receipt.totalAmount ? formatCurrency(receipt.totalAmount) : '-'} />
                            <DetailRow label="Amount Paid" value={formatCurrency(receipt.amountReceived)} />
                            <DetailRow label="Balance Due" value={receipt.amountDue ? formatCurrency(receipt.amountDue) : '-'} />
                        </div>
                    </>
                )}
              </div>

              <footer className="flex justify-end items-center text-center pt-16">
                 <div className="w-1/2">
                    <div className="border-b-2 border-foreground w-full"></div>
                    <p className="text-sm mt-2 font-semibold">AUTHORISED SIGNATORY</p>
                    {issuedBy && <p className="text-xs text-muted-foreground">{issuedBy.name} - {issuedBy.title}</p>}
                 </div>
              </footer>
        </DocumentPage>
      </main>
    </div>
  );
}
