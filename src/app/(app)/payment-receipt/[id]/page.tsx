// src/app/(app)/payment-receipt/[id]/page.tsx

'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Download, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { numberToWords } from '@/lib/number-to-words';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type AnyReceipt = any;

const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => (
  <div className="flex items-start py-1">
    <p className="text-sm text-muted-foreground font-semibold whitespace-nowrap mr-2">{label}:</p>
    <p className="font-medium text-left break-words">{value ?? '-'}</p>
  </div>
);

const formatCurrency = (amount: number | null | undefined) => {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);
};

const safeFormatDateShort = (value: unknown) => {
  if (!value) return '-';
  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) return '-';
  return format(d, 'dd/MM/yyyy');
};

export default function PaymentReceiptPreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const receiptId = params?.id as string | undefined;
  const [receipt, setReceipt] = useState<AnyReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDelete = async () => {
    if (!firebaseUser || !receiptId) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/payment-receipts/${receiptId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({ title: 'Receipt deleted successfully' });
        router.push('/payment-receipt');
      } else {
        toast({ variant: 'destructive', title: 'Failed to delete receipt' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Network error deleting receipt' });
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchReceipt = async () => {
      if (!firebaseUser || !receiptId) return;

      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/payment-receipts/${receiptId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setReceipt(data ?? null);
        } else {
          toast({ variant: 'destructive', title: 'Receipt not found' });
          router.push('/payment-receipt');
        }
      } catch {
        if (!isMounted) return;
        toast({ variant: 'destructive', title: 'Could not fetch receipt' });
        router.push('/payment-receipt');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReceipt();
    return () => {
      isMounted = false;
    };
  }, [receiptId, router, toast, firebaseUser]);

  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Receipt..." className="no-print" />
        <main className="flex-1 p-6 text-center"><p>Loading receipt details...</p></main>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Receipt Not Found" className="no-print" />
        <main className="flex-1 p-6 text-center"><p>The requested receipt could not be found.</p></main>
      </div>
    );
  }

  const rawDate = receipt.date ?? receipt.paymentDate ?? receipt.createdAt ?? null;
  const formattedDate = safeFormatDateShort(rawDate);

  const clientName = receipt.client?.name ?? receipt.clientName ?? receipt.payerName ?? '-';
  const notes = receipt.notes ?? receipt.description ?? '-';
  const amount = typeof receipt.amount !== 'undefined' ? Number(receipt.amount) : 0;
  const paymentMethod = receipt.paymentMethod ?? receipt.method ?? '-';
  const amountRounded = Math.round(amount);
  const amountInWords = `${numberToWords(amountRounded)} Naira Only`;

  const receivingBank =
    receipt.receivingBank ??
    companyProfile.bankAccounts.find((b) => b.id === receipt.receivingBankId) ??
    null;

  const issuedBy =
    receipt.issuedBy ??
    companyProfile.signatories.find((s) => s.id === receipt.issuedById) ??
    null;

  return (
    <div className="flex flex-1 flex-col print:min-h-[100vh]">
      <Header title={`Receipt ${receipt.receiptNumber ?? ''}`} className="no-print" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4 print:p-8">
        <div className="mb-4 flex justify-end gap-2 no-print">
          <Button variant="outline" onClick={() => router.push('/payment-receipt')}>Back to list</Button>
          <Button variant="outline" onClick={() => router.push(`/payment-receipt/${receiptId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />Delete
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />Print or Save PDF
          </Button>
        </div>

        <DocumentPage>
          <header className="flex justify-between items-start mb-8 print:mb-4">
            <div className="flex items-center gap-4">
              {logoPlaceholder && (
                <Image
                  src={companyProfile?.logoUrl || logoPlaceholder.imageUrl}
                  alt="Company Logo"
                  width={80}
                  height={80}
                  data-ai-hint={logoPlaceholder.imageHint}
                  className="rounded-md object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold font-headline text-primary">{companyProfile?.name ?? 'Company'}</h1>
                {companyProfile?.address && (
                  <p className="text-xs text-muted-foreground max-w-xs">{companyProfile.address}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {companyProfile?.phone ?? ''}
                  {companyProfile?.phone && companyProfile?.email ? ' | ' : ''}
                  {companyProfile?.email ?? ''}
                </p>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-3xl font-bold font-headline">RECEIPT</h2>
              <p className="text-sm">No: <span className="font-semibold">{receipt.receiptNumber ?? '—'}</span></p>
              <p className="text-sm">Date: <span className="font-semibold">{formattedDate}</span></p>
            </div>
          </header>

          <Separator className="my-8 print:my-4" />

          <div className="space-y-6 mb-12 text-base print:mb-4 print:space-y-4">
            <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
              <div className="flex-1">
                <p className="text-muted-foreground">Received from:</p>
                <p className="font-bold text-lg border-b border-dashed pb-1">{clientName}</p>
              </div>

              <div className="flex-1">
                <p className="text-muted-foreground">the sum of</p>
                <p className="font-bold text-lg border-b border-dashed pb-1">{formatCurrency(amount)}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <p className="text-muted-foreground">Being payment for:</p>
              <p className="font-bold text-lg border-b border-dashed flex-1 pb-1">{notes}</p>
            </div>

            <div className="col-span-2 bg-primary/10 p-4 rounded-md text-center mt-6 print:mt-4 break-inside-avoid">
              <p className="text-sm text-primary font-semibold">AMOUNT IN FIGURES</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(amount)}</p>
            </div>

            <div className="mt-4 break-inside-avoid">
              <p className="text-sm"><strong>Amount in words:</strong></p>
              <p className="capitalize">{amountInWords}</p>
            </div>

            {/* Footer - side by side (print safe) */}
<footer className="flex justify-between items-end pt-12 gap-8 break-inside-avoid print:flex print:justify-between print:items-end print:gap-8 print:pt-8 print:mt-8">
  {/* Left side - payment details */}
  <div className="w-1/2 space-y-2">
    <DetailRow label="Invoice # / Ref" value={receipt.salesInvoices?.[0]?.invoiceNumber ?? '—'} />
    <DetailRow label="Payment Method" value={paymentMethod} />
    {receivingBank && (
      <DetailRow
        label="Receiving Bank"
        value={`${receivingBank.bankName} - ${receivingBank.accountNumber}`}
      />
    )}
  </div>

  {/* Right side - signatory */}
  <div className="w-1/2 text-center flex flex-col justify-end">
    {/* ✅ THIS LINE IS FIXED */}
    <div className="border-b-2 border-foreground w-2/3 mx-auto mb-2"></div>
    <h2 className="text-sm font-semibold">{issuedBy?.name ?? ''}</h2>
    <p className="text-xs text-muted-foreground">For: Bauweise Services Limited</p>
  </div>
</footer>

          </div>
        </DocumentPage>
      </main>
    </div>
  );
}
