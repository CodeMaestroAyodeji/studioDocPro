
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { numberToWords } from '@/lib/number-to-words';
import { Textarea } from '@/components/ui/textarea';
import type { PaymentReceipt, SalesInvoice } from '@/lib/types';
import { Combobox } from '@/components/ui/combobox';

const receiptSchema = z.object({
  receiptNumber: z.string(),
  date: z.date(),
  receivedFrom: z.string().min(1, 'This field is required'),
  amountReceived: z.coerce.number().positive('Amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  receivingBankId: z.string().optional(),
  relatedInvoiceNumber: z.string().optional(),
  paymentType: z.enum(['Full Payment', 'Part Payment', 'Final Payment']),
  notes: z.string().optional(),
  issuedBy: z.string().min(1, 'Please select who issued the receipt'),
  totalAmount: z.coerce.number().optional(),
  amountDue: z.coerce.number().optional(),
});

type StoredPaymentReceipt = Omit<PaymentReceipt, 'date'> & { date: string };
type StoredSalesInvoice = Omit<SalesInvoice, 'date' | 'dueDate'> & { date: string; dueDate: string };

const getInvoices = (): SalesInvoice[] => {
  if (typeof window === 'undefined') return [];
  const invoices: SalesInvoice[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('invoice_')) {
      const item = localStorage.getItem(key);
      if (item) {
        const storedInvoice: StoredSalesInvoice = JSON.parse(item);
        invoices.push({
            ...storedInvoice,
            date: new Date(storedInvoice.date),
            dueDate: new Date(storedInvoice.dueDate),
        });
      }
    }
  }
  return invoices.sort((a, b) => b.date.getTime() - a.date.getTime());
};


export default function EditPaymentReceiptPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;
  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);

  useEffect(() => {
    setInvoices(getInvoices());
  }, []);

  const invoiceOptions = useMemo(() => 
    invoices.map(inv => ({ label: `${inv.invoiceNumber} - ${inv.billTo}`, value: inv.invoiceNumber })), 
  [invoices]);

  const form = useForm<z.infer<typeof receiptSchema>>({
    resolver: zodResolver(receiptSchema),
  });

  useEffect(() => {
    try {
      const storedReceipt = localStorage.getItem(`receipt_${receiptId}`);
      if (storedReceipt) {
        const parsed: StoredPaymentReceipt = JSON.parse(storedReceipt);
        const receiptData = {
          ...parsed,
          date: new Date(parsed.date),
        };
        setReceipt(receiptData);
        form.reset(receiptData);
      } else {
        toast({ variant: 'destructive', title: 'Receipt not found' });
        router.push('/payment-receipt');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading receipt' });
      router.push('/payment-receipt');
    }
  }, [receiptId, router, toast, form]);

  const handleSubmit = (values: z.infer<typeof receiptSchema>) => {
    try {
      const receiptWithDateAsString = {
        ...values,
        date: values.date.toISOString(),
      };
      localStorage.setItem(`receipt_${values.receiptNumber}`, JSON.stringify(receiptWithDateAsString));
      toast({
        title: 'Receipt Updated',
        description: `Receipt ${values.receiptNumber} has been updated.`,
      });
      router.push(`/payment-receipt/${values.receiptNumber}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error Saving Receipt' });
    }
  };

  const amountInWords = numberToWords(form.watch('amountReceived'));
  const paymentType = form.watch('paymentType');

  if (!receipt) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Receipt..." />
        <main className="flex-1 p-6 text-center"><p>Loading receipt for editing...</p></main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Edit Receipt ${receipt.receiptNumber}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print gap-2">
          <Button variant="outline" onClick={() => router.push(`/payment-receipt/${receiptId}`)}>Cancel</Button>
          <Button type="submit" form="receipt-form">Save Changes</Button>
        </div>
        <Form {...form}>
          <form id="receipt-form" onSubmit={form.handleSubmit(handleSubmit)}>
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
                  <p className="text-sm">No: <span className="font-semibold">{form.watch('receiptNumber')}</span></p>
                </div>
              </header>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                      </Popover>
                  </FormItem>
                )} />
                 <FormField control={form.control} name="amountReceived" render={({ field }) => (
                   <FormItem>
                     <FormLabel>Amount Received (₦)</FormLabel>
                     <FormControl><Input type="number" {...field} className="text-2xl h-12 font-bold" /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )} />
              </div>

               <div className="border rounded-lg p-4 space-y-4 mb-8">
                    <FormField control={form.control} name="receivedFrom" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Received From</FormLabel>
                        <FormControl><Input placeholder="Client or Payer Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <p className="text-sm font-semibold pt-2">Amount in words</p>
                    <p className="text-muted-foreground capitalize">{amountInWords}</p>

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                           <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="POS">POS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField
                            control={form.control}
                            name="relatedInvoiceNumber"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>For Invoice # (Optional)</FormLabel>
                                <Combobox
                                    options={invoiceOptions}
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder="Select an invoice"
                                    searchPlaceholder="Search invoices..."
                                    emptyMessage="No invoices found."
                                />
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                     <FormField control={form.control} name="receivingBankId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Receiving Bank</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={companyProfile.bankAccounts.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {companyProfile.bankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="paymentType" render={({ field }) => (
                       <FormItem>
                           <FormLabel>Payment Type</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                   <SelectItem value="Full Payment">Full Payment</SelectItem>
                                   <SelectItem value="Part Payment">Part Payment</SelectItem>
                                   <SelectItem value="Final Payment">Final Payment</SelectItem>
                               </SelectContent>
                           </Select>
                       </FormItem>
                    )} />

                    {paymentType === 'Part Payment' && (
                       <div className="grid md:grid-cols-2 gap-4">
                           <FormField control={form.control} name="totalAmount" render={({ field }) => (
                               <FormItem>
                                   <FormLabel>Total Invoice Amount</FormLabel>
                                   <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                               </FormItem>
                           )} />
                           <FormField control={form.control} name="amountDue" render={({ field }) => (
                               <FormItem>
                                   <FormLabel>Amount Due</FormLabel>
                                   <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                               </FormItem>
                           )} />
                       </div>
                    )}
                    
                     <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>Payment Description</FormLabel><FormControl><Textarea placeholder="e.g., Part payment for website design" {...field} /></FormControl></FormItem>
                    )} />
               </div>

              <footer className="grid grid-cols-2 items-end gap-8 pt-8">
                 <div>
                    <p className="text-xs text-muted-foreground">Please keep this receipt for your records.</p>
                 </div>
                 <FormField control={form.control} name="issuedBy" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issued By</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={companyProfile.signatories.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select signatory" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {companyProfile.signatories.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {s.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                      </FormItem>
                  )} />
              </footer>
            </DocumentPage>
          </form>
        </Form>
      </main>
    </div>
  );
}
