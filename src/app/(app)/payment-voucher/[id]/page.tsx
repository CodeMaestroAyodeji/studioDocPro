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
import type { PaymentVoucher } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type StoredPaymentVoucher = Omit<PaymentVoucher, 'date'> & { date: string };

const DetailRow = ({ label, value, valueClassName, labelClassName }: { label: string; value: string | undefined | null, valueClassName?: string, labelClassName?: string }) => (
    <div className="grid grid-cols-3 gap-1 py-1">
        <span className={cn("font-semibold text-muted-foreground", labelClassName)}>{label}:</span>
        <span className={`col-span-2 ${valueClassName}`}>{value}</span>
    </div>
);

export default function PaymentVoucherPreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const voucherId = params.id as string;
  const [voucher, setVoucher] = useState<PaymentVoucher | null>(null);

  useEffect(() => {
    try {
      const storedVoucher = localStorage.getItem(`voucher_${voucherId}`);
      if (storedVoucher) {
        const parsed: StoredPaymentVoucher = JSON.parse(storedVoucher);
        setVoucher({
          ...parsed,
          date: new Date(parsed.date),
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Voucher not found',
        });
        router.push('/payment-voucher');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading voucher',
      });
      router.push('/payment-voucher');
    }
  }, [voucherId, router, toast]);

  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');

  if (!voucher) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Voucher..." className="no-print" />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 text-center">
            <p>Loading voucher details...</p>
        </main>
      </div>
    );
  }

  const formattedDate = format(voucher.date, 'dd/MM/yyyy');
  const amountInWords = numberToWords(voucher.amount);
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(voucher.amount);
  const fromAccount = companyProfile.bankAccounts.find(b => b.id === voucher.bankAccountId);
  const preparedBy = companyProfile.signatories.find(s => s.id === voucher.preparedBy);
  const approvedBy = companyProfile.signatories.find(s => s.id === voucher.approvedBy);
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Voucher ${voucher.voucherNumber}`} className="no-print" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="mb-4 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={() => router.push(`/payment-voucher/${voucherId}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <Button onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Print Voucher
            </Button>
        </div>

        <DocumentPage className="payment-voucher-print text-base">
          {/* Header */}
          <header className="grid grid-cols-2 gap-8 mb-12">
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
              <h2 className="font-bold text-lg">{companyProfile.name}</h2>
              <p className="text-sm text-muted-foreground">{companyProfile.address}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold font-headline text-primary mb-2 whitespace-nowrap">PAYMENT VOUCHER</h1>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <span className="font-semibold">Voucher #</span><span>{voucher.voucherNumber}</span>
                <span className="font-semibold">Voucher Date</span><span>{formattedDate}</span>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="space-y-4 mb-8">
             <div className="grid grid-cols-3 gap-1 py-1">
                <span className="font-semibold text-muted-foreground">Being Payment to:</span>
                <span className="col-span-2 font-bold text-lg">{voucher.payeeName}</span>
            </div>
             <div className="grid grid-cols-3 gap-1 py-1">
                <span className="font-semibold text-muted-foreground">For:</span>
                <span className="col-span-2 font-bold text-lg">{voucher.description}</span>
            </div>
             <div className="py-2 mt-4 border-t border-b">
                <p className="font-semibold text-muted-foreground">Amount:</p>
                <p className="font-bold text-xl">{formattedAmount}</p>
             </div>
             <div className="py-2">
                <p className="font-semibold text-muted-foreground">Amount in words:</p>
                <p className="capitalize">{amountInWords}</p>
             </div>
          </div>
          
          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="space-y-2">
                <DetailRow label="Payment Method" value={voucher.paymentMethod} labelClassName="whitespace-nowrap"/>
                <DetailRow label="From Account" value={`${fromAccount?.bankName} - ${fromAccount?.accountNumber}`} labelClassName="whitespace-nowrap"/>
            </div>
             <div className="space-y-2">
                <p className="font-semibold text-muted-foreground">Payee Bank Details:</p>
                 <DetailRow label="Bank Name" value={voucher.payeeBankName} />
                 <DetailRow label="Account Name" value={voucher.payeeAccountName} />
                 <DetailRow label="Account Number" value={voucher.payeeAccountNumber} labelClassName="whitespace-nowrap" />
            </div>
          </div>


          {/* Footer */}
          <footer className="grid grid-cols-2 gap-8 pt-8 mt-12">
             <div className="text-center">
                <p className='text-sm mt-2'>Prepared By</p>
                <div className="border-b border-foreground w-1/2 mx-auto mt-12 mb-2"></div>
                <p className="text-sm font-semibold mt-1">{preparedBy?.name}</p>
             </div>
             <div className="text-center">
                <p className='text-sm mt-2'>Approved By</p>
                <div className="border-b border-foreground w-1/2 mx-auto mt-12 mb-2"></div>
                <p className="text-sm font-semibold mt-1">{approvedBy?.name}</p>
             </div>
          </footer>
        </DocumentPage>
      </main>
    </div>
  );
}
