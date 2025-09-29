'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react"
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { DocumentToolbar } from '@/components/document-toolbar';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AISuggestionButton } from '@/components/ai-suggestion-button';
import { getNextVoucherNumber } from '@/lib/voucher-sequence';
import { numberToWords } from '@/lib/number-to-words';

const voucherSchema = z.object({
  voucherNumber: z.string(),
  payeeName: z.string().min(1, 'Payee name is required'),
  date: z.date(),
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  bankAccountId: z.string().min(1, "Please select a bank account"),
  description: z.string().min(1, "Description is required"),
  preparedBy: z.string().min(1, "Please select who prepared the voucher"),
  approvedBy: z.string().min(1, "Please select who approved the voucher"),
});

export default function PaymentVoucherPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');
  const [voucherNumber, setVoucherNumber] = useState('');
  
  const form = useForm<z.infer<typeof voucherSchema>>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      voucherNumber: '',
      payeeName: '',
      date: new Date(),
      amount: 0,
      paymentMethod: 'Bank Transfer',
      bankAccountId: companyProfile.bankAccounts[0]?.id || '',
      description: '',
      preparedBy: '',
      approvedBy: '',
    },
  });

  useEffect(() => {
    const nextVoucherNumber = getNextVoucherNumber();
    setVoucherNumber(nextVoucherNumber);
    form.setValue('voucherNumber', nextVoucherNumber);
  }, [form]);

  const handleSubmit = (values: z.infer<typeof voucherSchema>) => {
     console.log(values);
     toast({
        title: 'Voucher Saved (Simulated)',
        description: `Voucher ${values.voucherNumber} has been saved.`,
     });
     
     const nextVoucherNumber = getNextVoucherNumber(true);
     setVoucherNumber(nextVoucherNumber);
     form.reset({
        ...form.getValues(),
        voucherNumber: nextVoucherNumber,
        payeeName: '',
        amount: 0,
        description: '',
        date: new Date(),
        preparedBy: '',
        approvedBy: '',
     });
  };

  const watchedDate = form.watch('date');
  const formattedDate = watchedDate ? format(watchedDate, 'dd/MM/yyyy') : '';
  const amountInWords = numberToWords(form.watch('amount'));
  const watchedForm = form.watch();

  return (
    <div className="flex flex-1 flex-col">
      <Header title="New Payment Voucher" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <DocumentToolbar />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
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
                    <span className="font-semibold">Voucher #</span><span>{voucherNumber}</span>
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
                          <PopoverContent className="w-auto p-0 no-print">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                    )} />
                    <div className="form-item-print-view">
                      <span className="print-label">Voucher Date</span>
                      <span className="print-value">{formattedDate}</span>
                    </div>
                  </div>
                   <div className="space-y-2">
                     <span className="text-sm font-semibold text-muted-foreground">Amount (₦)</span>
                     <FormField control={form.control} name="amount" render={({ field }) => <Input type="number" {...field} className="text-2xl h-12 text-right font-bold" />} />
                      <div className="form-item-print-view">
                        <span className="print-label">Amount (₦)</span>
                        <span className="print-value">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(watchedForm.amount)}</span>
                      </div>
                   </div>
              </div>

               <div className="border rounded-lg p-4 space-y-4 mb-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="payeeName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payee Name</FormLabel>
                            <div className="flex items-center gap-1">
                               <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                               <AISuggestionButton fieldName="payeeName" form={form} formSchema={voucherSchema} />
                            </div>
                            <FormMessage />
                            <div className="form-item-print-view">
                                <span className="print-label">Payee Name</span>
                                <span className="print-value">{watchedForm.payeeName}</span>
                            </div>
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
                                    <SelectContent className="no-print">
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                <div className="form-item-print-view">
                                    <span className="print-label">Payment Method</span>
                                    <span className="print-value">{watchedForm.paymentMethod}</span>
                                </div>
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
                                    <SelectContent className="no-print">
                                       {companyProfile.bankAccounts.map(acc => (
                                         <SelectItem key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</SelectItem>
                                       ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                <div className="form-item-print-view">
                                    <span className="print-label">From Account</span>
                                    <span className="print-value">{companyProfile.bankAccounts.find(b => b.id === watchedForm.bankAccountId)?.bankName} - {companyProfile.bankAccounts.find(b => b.id === watchedForm.bankAccountId)?.accountNumber}</span>
                                </div>
                            </FormItem>
                        )} />
                     <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description of Payment</FormLabel>
                             <div className="flex items-center gap-1">
                                <FormControl><Input placeholder="e.g. Payment for invoice #123" {...field} /></FormControl>
                                 <AISuggestionButton fieldName="description" form={form} formSchema={voucherSchema} />
                             </div>
                            <FormMessage />
                             <div className="form-item-print-view">
                                <span className="print-label">Description of Payment</span>
                                <span className="print-value">{watchedForm.description}</span>
                            </div>
                          </FormItem>
                        )} />
                     
                     <div className="pt-2">
                        <p className="text-sm font-semibold">Amount in words</p>
                        <p className="text-muted-foreground capitalize">{amountInWords}</p>
                     </div>
               </div>

              <Separator className="my-8" />
              
              <footer className="grid grid-cols-2 gap-8 pt-8">
                 <FormField control={form.control} name="preparedBy" render={({ field }) => (
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
                        <div className="form-item-print-view mt-12">
                           <span className="print-value border-t border-dashed pt-2">{companyProfile.signatories.find(s => s.id === watchedForm.preparedBy)?.name}</span>
                        </div>
                      </FormItem>
                  )} />
                 <FormField control={form.control} name="approvedBy" render={({ field }) => (
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
                        <div className="form-item-print-view mt-12">
                           <span className="print-value border-t border-dashed pt-2">{companyProfile.signatories.find(s => s.id === watchedForm.approvedBy)?.name}</span>
                        </div>
                      </FormItem>
                  )} />
              </footer>

               <div className="flex justify-end mt-8 no-print">
                    <Button type="submit">Save Voucher</Button>
               </div>
            </DocumentPage>
          </form>
        </Form>
      </main>
    </div>
  );
}
