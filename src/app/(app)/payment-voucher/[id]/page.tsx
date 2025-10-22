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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import type { PaymentVoucher, BankAccount, Signatory } from '@prisma/client';

type PaymentVoucherDetails = PaymentVoucher & {
    bankAccount: BankAccount;
    preparedBy: Signatory;
    approvedBy: Signatory;
};

const DetailRow = ({ label, value, valueClassName, labelClassName }: { label: string; value: string | undefined | null, valueClassName?: string, labelClassName?: string }) => (
    <div className="grid grid-cols-3 gap-1 py-1">
        <span className={cn("font-semibold text-muted-foreground", labelClassName)}>{label}:</span>
        <span className={cn("col-span-2", valueClassName)}>{value}</span>
    </div>
);

export default function PaymentVoucherPreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const voucherId = params.id as string;
  const { firebaseUser } = useAuth();
  const [voucher, setVoucher] = useState<PaymentVoucherDetails | null>(null);

  useEffect(() => {
    if (!firebaseUser || !voucherId) return;
    const tokenPromise = firebaseUser.getIdToken();

    const fetchVoucher = async () => {
        const token = await tokenPromise;
        try {
            const response = await fetch(`/api/payment-vouchers/${voucherId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setVoucher(data);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch voucher data.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch voucher data.' });
        }
    };

    fetchVoucher();
  }, [voucherId, firebaseUser, toast]);

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

  const formattedDate = format(new Date(voucher.paymentDate), 'dd/MM/yyyy');
  const amountInWords = numberToWords(voucher.amount);
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(voucher.amount);
  
  const handlePrint = () => {
    if (!voucher) return;

    const originalTitle = document.title;
    const safePayeeName = voucher.payeeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const formattedDateForFile = format(new Date(voucher.paymentDate), 'yyyy-MM-dd');
    const newTitle = `${safePayeeName}_${voucher.voucherNumber}_${formattedDateForFile}`;
    
    document.title = newTitle;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Voucher ${voucher.voucherNumber}`} className="no-print" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="mb-4 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={() => router.push('/payment-voucher')}>
                Back to list
            </Button>
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
          <div className="space-y-4 mb-8 mt-12">
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
                <p className="font-semibold text-muted-foreground">From Account Details:</p>
                <DetailRow label="Payment Method" value={voucher.paymentMethod} labelClassName="whitespace-nowrap"/>
                <DetailRow label="Bank Name" value={voucher.bankAccount.bankName} />
                <DetailRow label="Account Name" value={voucher.bankAccount.accountName} />
                <DetailRow label="Account Number" value={voucher.bankAccount.accountNumber} labelClassName="whitespace-nowrap" />
            </div>
             <div className="space-y-2">
                <p className="font-semibold text-muted-foreground">Payee Bank Details:</p>
                 <DetailRow label="Bank Name" value={voucher.payeeBankName} />
                 <DetailRow label="Account Name" value={voucher.payeeAccountName} />
                 <DetailRow label="Account Number" value={voucher.payeeAccountNumber} labelClassName="whitespace-nowrap" />
            </div>
          </div>


          {/* Footer */}
          <footer className="flex justify-between pt-4">
             <div className="text-center">
                <p className='text-sm mt-2'>Prepared By</p>
                <div className="h-12"></div>
                <div className="border-b border-foreground w-1/2 mx-auto"></div>
                <p className='text-sm font-semibold mt-1'>{voucher.preparedBy.name}</p>
             </div>
             <div className="text-center">
                <p className='text-sm mt-2'>Approved By</p>
                <div className="h-12"></div>
                <div className="border-b border-foreground w-1/2 mx-auto"></div>
                <p className='text-sm font-semibold mt-1'>{voucher.approvedBy.name}</p>
             </div>
          </footer>
            <div className="text-center text-xs text-muted-foreground pt-12">
                <p className='font-bold text-sm text-foreground'>{companyProfile.name}</p>
                <p>{companyProfile.address}</p>
                <p>
                    <span>{companyProfile.phone}</span> | <span>{companyProfile.email}</span> | <span>{companyProfile.website}</span>
                </p>
            </div>
        </DocumentPage>
      </main>
    </div>
  );
}
