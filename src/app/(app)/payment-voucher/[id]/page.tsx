'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { numberToWords } from '@/lib/number-to-words';
import type { PaymentVoucher } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type StoredPaymentVoucher = Omit<PaymentVoucher, 'date'> & { date: string };

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
        <Header title="Loading Voucher..." />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 text-center">
            <p>Loading voucher details...</p>
        </main>
      </div>
    );
  }

  const formattedDate = format(voucher.date, 'dd/MM/yyyy');
  const amountInWords = numberToWords(voucher.amount);
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
            <Button variant="outline" onClick={() => router.push(`/payment-voucher`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <Button onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Print Voucher
            </Button>
        </div>

        <DocumentPage className="payment-voucher-print">
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
              <h2 className="font-bold text-lg">{companyProfile.name}</h2>
              <p className="text-sm text-muted-foreground">{companyProfile.address}</p>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold font-headline text-primary mb-2">PAYMENT VOUCHER</h1>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <span className="font-semibold">Voucher #</span><span>{voucher.voucherNumber}</span>
                <span className="font-semibold">Voucher Date</span><span>{formattedDate}</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
              <div>
                <span className="print-label">Amount</span>
                <p className="font-bold text-2xl">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(voucher.amount)}</p>
              </div>
          </div>

           <div className="border rounded-lg p-4 space-y-4 mb-8">
                <div className="form-item-print-view" style={{display: 'block'}}>
                    <span className="print-label">Payee Name</span>
                    <span className="print-value">{voucher.payeeName}</span>
                </div>
                <div className="form-item-print-view" style={{display: 'block'}}>
                    <span className="print-label">Payment Method</span>
                    <span className="print-value">{voucher.paymentMethod}</span>
                </div>
                <div className="form-item-print-view" style={{display: 'block'}}>
                    <span className="print-label">From Account</span>
                    <span className="print-value">{fromAccount?.bankName} - {fromAccount?.accountNumber}</span>
                </div>
                <div className="form-item-print-view" style={{display: 'block'}}>
                    <span className="print-label">Description of Payment</span>
                    <span className="print-value">{voucher.description}</span>
                </div>
                 
                 <div className="pt-2">
                    <p className="text-sm font-semibold">Amount in words</p>
                    <p className="text-muted-foreground capitalize">{amountInWords}</p>
                 </div>
           </div>

          <Separator className="my-8" />
          
          <footer className="grid grid-cols-2 gap-8 pt-12 mt-12">
             <div className="form-item-print-view" style={{display: 'block'}}>
                <p className='text-sm mb-2'>Prepared By</p>
                <span className="print-value border-t border-dashed pt-2">{preparedBy?.name}</span>
             </div>
             <div className="form-item-print-view" style={{display: 'block'}}>
                <p className='text-sm mb-2'>Approved By</p>
                <span className="print-value border-t border-dashed pt-2">{approvedBy?.name}</span>
             </div>
          </footer>
        </DocumentPage>
      </main>
    </div>
  );
}
