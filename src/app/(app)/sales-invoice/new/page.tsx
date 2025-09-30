
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from '@/components/ui/textarea';
import { getNextInvoiceNumber } from '@/lib/invoice-sequence';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { SalesInvoice } from '@/lib/types';

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  date: z.date(),
  dueDate: z.date(),
  billTo: z.string().min(1, 'Client details are required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  applyVat: z.boolean(),
  paymentAccountId: z.string().min(1, 'Please select a payment account'),
});

const VAT_RATE = 7.5; // 7.5%

export default function NewSalesInvoicePage() {
  const { state: companyProfile } = useCompanyProfile();
  const router = useRouter();
  const { toast } = useToast();
  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      date: new Date(),
      dueDate: addDays(new Date(), 14),
      billTo: '',
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }],
      notes: 'Thank you for your business. Please make payment to the account below.',
      applyVat: true,
      paymentAccountId: companyProfile.bankAccounts[0]?.id || '',
    },
  });

  useEffect(() => {
    const nextInvoiceNumber = getNextInvoiceNumber();
    setInvoiceNumber(nextInvoiceNumber);
    form.setValue('invoiceNumber', nextInvoiceNumber);
  }, [form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const applyVat = useWatch({ control: form.control, name: 'applyVat' });

  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((acc, item) => {
      return acc + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);

    const vatAmount = applyVat ? subtotal * (VAT_RATE / 100) : 0;
    const grandTotal = subtotal + vatAmount;

    return { subtotal, vatAmount, grandTotal };
  };

  const { subtotal, vatAmount, grandTotal } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleSubmit = (values: z.infer<typeof invoiceSchema>) => {
    try {
      getNextInvoiceNumber(true); // Increment and save the new invoice number
      const invoiceWithDateAsString = {
        ...values,
        date: values.date.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };
      localStorage.setItem(`invoice_${values.invoiceNumber}`, JSON.stringify(invoiceWithDateAsString));
      toast({
        title: 'Invoice Saved',
        description: `Invoice ${values.invoiceNumber} has been saved.`,
      });
      router.push(`/sales-invoice/${values.invoiceNumber}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Invoice',
        description: 'Could not save the invoice to local storage.',
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title="New Sales Invoice" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
          <Button type="submit" form="invoice-form">Save Invoice</Button>
        </div>
        <Form {...form}>
          <form id="invoice-form" onSubmit={form.handleSubmit(handleSubmit)}>
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
                  <p className="font-semibold">{companyProfile.name}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{companyProfile.address}</p>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold font-headline text-primary mb-2">INVOICE</h1>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span className="font-semibold">Invoice #</span><span>{invoiceNumber}</span>
                  </div>
                </div>
              </header>

              <section className="grid md:grid-cols-3 gap-x-8 mb-8">
                <FormField control={form.control} name="billTo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-muted-foreground">BILL TO</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Client Name&#10;Client Address&#10;Client Contact" {...field} className="min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="md:col-span-2 md:text-right space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <FormLabel className="font-semibold md:text-right md:col-start-3">Invoice Date:</FormLabel>
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant="outline" className="text-left font-normal w-full"><CalendarIcon className="mr-2 h-4 w-4" />{format(field.value, 'dd/MM/yyyy')}</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                            </Popover>
                        )} />
                    </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <FormLabel className="font-semibold md:text-right md:col-start-3">Due Date:</FormLabel>
                        <FormField control={form.control} name="dueDate" render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant="outline" className="text-left font-normal w-full"><CalendarIcon className="mr-2 h-4 w-4" />{format(field.value, 'dd/MM/yyyy')}</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                            </Popover>
                        )} />
                    </div>
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
                      <TableHead className="no-print"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => <Input placeholder="Item description" {...field} />} />
                        </TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => <Input type="number" {...field} className="text-right" />} />
                        </TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => <Input type="number" {...field} className="text-right w-full" />} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0))}
                        </TableCell>
                        <TableCell className="no-print">
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 no-print">
                  <Button type="button" variant="outline" onClick={() => append({ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes / Terms</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="paymentAccountId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Details</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={companyProfile.bankAccounts.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select account for payment" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {companyProfile.bankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Subtotal:</span> <span className="font-medium">{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between items-center">
                        <FormField
                            control={form.control}
                            name="applyVat"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="apply-vat" /></FormControl>
                                <FormLabel htmlFor="apply-vat" className="text-muted-foreground">VAT ({VAT_RATE}%):</FormLabel>
                                </FormItem>
                            )}
                        />
                        <span className="font-medium">{formatCurrency(vatAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold text-primary"><span >Total:</span> <span>{formatCurrency(grandTotal)}</span></div>
                </div>
              </section>
              
              <footer className="text-center text-xs text-muted-foreground pt-12">
                 <p>{companyProfile.phone} | {companyProfile.email} | {companyProfile.website}</p>
              </footer>
            </DocumentPage>
          </form>
        </Form>
      </main>
    </div>
  );
}
