'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { PlusCircle, Trash2 } from 'lucide-react';
import { DocumentToolbar } from '@/components/document-toolbar';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AISuggestionButton } from '@/components/ai-suggestion-button';
import { Textarea } from '@/components/ui/textarea';

const poItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
  tax: z.coerce.number().min(0, 'Cannot be negative').max(100, 'Cannot be > 100'),
});

const poSchema = z.object({
  poNumber: z.string().min(1, 'PO Number is required'),
  date: z.date(),
  vendor: z.string().min(1, 'Vendor details are required'),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
});

export default function PurchaseOrderPage() {
  const { state: companyProfile } = useCompanyProfile();
  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');
  const [poNumber, setPoNumber] = useState('');

  useEffect(() => {
    const randomPo = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
    setPoNumber(randomPo);
  }, []);

  const form = useForm<z.infer<typeof poSchema>>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      poNumber: '',
      date: new Date(),
      vendor: '',
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, tax: 0 }],
    },
  });
  
  useEffect(() => {
    if (poNumber) {
      form.setValue('poNumber', poNumber);
    }
  }, [poNumber, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const totalTax = watchedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice * item.tax) / 100, 0);
    const grandTotal = subtotal + totalTax;
    return { subtotal, totalTax, grandTotal };
  };

  const { subtotal, totalTax, grandTotal } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title="New Purchase Order" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <DocumentToolbar />
        <Form {...form}>
          <form>
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
                  <h2 className="font-bold text-lg">{companyProfile.name}</h2>
                  <p className="text-sm text-muted-foreground">{companyProfile.address}</p>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold font-headline text-primary mb-2">PURCHASE ORDER</h1>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span className="font-semibold">PO #</span><span>{poNumber}</span>
                    <span className="font-semibold">Date</span><span>{format(form.watch('date'), 'PPP')}</span>
                  </div>
                </div>
              </header>

              <section className="mb-8">
                <FormField control={form.control} name="vendor" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">VENDOR:</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Vendor Name&#10;Vendor Address&#10;Vendor Contact" {...field} className="min-h-[60px]" />
                    </FormControl>
                  </FormItem>
                )} />
              </section>

              <section className="mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Tax (%)</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="no-print"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                           <div className="flex items-center gap-1">
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                <Input placeholder="Item description" {...field} className="flex-1" />
                            )} />
                            <AISuggestionButton fieldName={`items.${index}.description`} form={form} formSchema={poSchema.shape.items.element.shape} />
                           </div>
                        </TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => <Input type="number" {...field} className="text-right" />} />
                        </TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => <Input type="number" {...field} className="text-right" />} />
                        </TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.tax`} render={({ field }) => <Input type="number" {...field} className="text-right" />} />
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
                  <TableFooter>
                     <TableRow>
                         <TableCell colSpan={4} className="text-right font-semibold">Subtotal</TableCell>
                         <TableCell className="text-right font-bold">{formatCurrency(subtotal)}</TableCell>
                         <TableCell className="no-print"></TableCell>
                     </TableRow>
                     <TableRow>
                         <TableCell colSpan={4} className="text-right font-semibold">Total Tax</TableCell>
                         <TableCell className="text-right font-bold">{formatCurrency(totalTax)}</TableCell>
                         <TableCell className="no-print"></TableCell>
                     </TableRow>
                     <TableRow className="text-lg">
                         <TableCell colSpan={4} className="text-right font-bold">Grand Total</TableCell>
                         <TableCell className="text-right font-bold text-primary">{formatCurrency(grandTotal)}</TableCell>
                         <TableCell className="no-print"></TableCell>
                     </TableRow>
                  </TableFooter>
                </Table>
                <div className="mt-4 no-print">
                    <Button type="button" variant="outline" onClick={() => append({ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, tax: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
              </section>

              <Separator className="my-8" />
              
              <footer className="grid grid-cols-2 gap-8 pt-8">
                 {companyProfile.signatories.slice(0, 2).map((s, i) => (
                    <div key={s.id} className="pt-8 border-t border-dashed">
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.title}</p>
                    </div>
                ))}
              </footer>
            </DocumentPage>
          </form>
        </Form>
      </main>
    </div>
  );
}
