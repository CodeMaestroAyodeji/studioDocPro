'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react"
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { numberToWords } from '@/lib/number-to-words';
import { useAuth } from '@/contexts/auth-context';

const voucherSchema = z.object({
  payeeName: z.string().min(1, 'Payee name is required'),
  date: z.date(),
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  bankAccountId: z.string().min(1, "Please select a bank account"),
  description: z.string().min(1, "Description is required"),
  preparedById: z.string().min(1, "Please select who prepared the voucher"),
  approvedById: z.string().min(1, "Please select who approved the voucher"),
  payeeBankName: z.string().optional(),
  payeeAccountName: z.string().optional(),
  payeeAccountNumber: z.string().optional(),
  notes: z.string().optional(),
});

export default function EditPaymentVoucherPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const voucherId = params.id as string;
  const { firebaseUser } = useAuth();
  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');
  
  const form = useForm<z.infer<typeof voucherSchema>>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      payeeName: '',
      date: new Date(),
      amount: 0,
      paymentMethod: 'Bank Transfer',
      description: '',
      payeeBankName: '',
      payeeAccountName: '',
      payeeAccountNumber: '',
      notes: '',
    },
  });

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
                form.reset({
                    ...data,
                    date: new Date(data.paymentDate),
                    preparedById: String(data.preparedById),
                    approvedById: String(data.approvedById),
                    bankAccountId: String(data.bankAccountId),
                });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch voucher data.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch voucher data.' });
        }
    };

    fetchVoucher();
  }, [voucherId, firebaseUser, form, toast]);


  const handleSubmit = async (values: z.infer<typeof voucherSchema>) => {
     if (!firebaseUser) return;
     const token = await firebaseUser.getIdToken();
     try {
        const response = await fetch(`/api/payment-vouchers/${voucherId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(values),
        });

        if (response.ok) {
            const updatedVoucher = await response.json();
            toast({
                title: 'Voucher Updated',
                description: `Voucher ${updatedVoucher.voucherNumber} has been updated.`,
            });
            router.push(`/payment-voucher/${updatedVoucher.id}`);
        } else {
            const errorData = await response.json();
            toast({
                variant: 'destructive',
                title: 'Error Updating Voucher',
                description: errorData.error || 'Could not update the voucher.',
            });
        }
     } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Updating Voucher',
            description: 'An unexpected error occurred.',
        });
     }
  };

  const watchedDate = form.watch('date');
  const formattedDate = watchedDate ? format(watchedDate, 'dd/MM/yyyy') : '';
  const amountInWords = numberToWords(form.watch('amount'));
  const watchedForm = form.watch();

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Edit Voucher ${watchedForm.voucherNumber}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print gap-2">
            <Button variant="outline" onClick={() => router.push(`/payment-voucher/${voucherId}`)}>Cancel</Button>
            <Button type="submit" form="voucher-form">Save Changes</Button>
        </div>
        <Form {...form}>
          <form id="voucher-form" onSubmit={form.handleSubmit(handleSubmit)}>
            <DocumentPage>
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
                  <h1 className="text-4xl font-bold font-headline text-primary mb-2">PAYMENT VOUCHER</h1>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span className="font-semibold">Voucher #</span><span>{watchedForm.voucherNumber}</span>
                    <span className="font-semibold">Voucher Date</span><span>{formattedDate}</span>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Voucher Date</span>
                    <FormField control={form.control} name="date" render={({ field }) => (
                       <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                    )} />
                  </div>
                   <div className="space-y-2">
                     <span className="text-sm font-semibold text-muted-foreground">Amount (₦)</span>
                     <FormField control={form.control} name="amount" render={({ field }) => <Input type="number" {...field} className="text-2xl h-12 text-right font-bold" />} />
                   </div>
              </div>

               <div className="border rounded-lg p-4 space-y-4 mb-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="payeeName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payee Name</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                           <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a payment method" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="bankAccountId" render={({ field }) => (
                           <FormItem>
                                <FormLabel>From Account</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={companyProfile.bankAccounts.length === 0}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={companyProfile.bankAccounts.length === 0 ? "No bank accounts set up" : "Select an account"} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       {companyProfile.bankAccounts.map(acc => (
                                         <SelectItem key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</SelectItem>
                                       ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                     <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description of Payment</FormLabel>
                            <FormControl><Input placeholder="e.g. Payment for invoice #123" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                     
                     <div className="pt-2">
                        <p className="text-sm font-semibold">Amount in words</p>
                        <p className="text-muted-foreground capitalize">{amountInWords}</p>
                     </div>

                    <Separator className="my-4" />
                    <p className="text-sm font-semibold">Payee Bank Details (Optional)</p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="payeeBankName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl><Input placeholder="e.g. Zenith Bank" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="payeeAccountName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="payeeAccountNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                    </div>
               </div>

              <Separator className="my-8" />
              
              <footer className="grid grid-cols-2 gap-8 pt-8">
                 <FormField control={form.control} name="preparedById" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prepared By</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={companyProfile.signatories.length === 0}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={companyProfile.signatories.length === 0 ? "No signatories set up" : "Select signatory"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="no-print">
                                {companyProfile.signatories.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} - {s.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />
                 <FormField control={form.control} name="approvedById" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approved By</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={companyProfile.signatories.length === 0}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={companyProfile.signatories.length === 0 ? "No signatories set up" : "Select signatory"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="no-print">
                                {companyProfile.signatories.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} - {s.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />
              </footer>
                 <div className="text-center text-xs text-muted-foreground pt-12">
                    <p className='font-bold text-sm text-foreground'>{companyProfile.name}</p>
                    <p>{companyProfile.address}</p>
                    <p>
                        <span>{companyProfile.phone}</span> | <span>{companyProfile.email}</span> | <span>{companyProfile.website}</span>
                    </p>
                 </div>
            </DocumentPage>
          </form>
        </Form>
      </main>
    </div>
  );
}