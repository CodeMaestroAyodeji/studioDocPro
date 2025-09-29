'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { PlusCircle, Trash2 } from 'lucide-react';
import { DocumentToolbar } from '@/components/document-toolbar';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from '@/components/ui/textarea';
import { getNextPoNumber } from '@/lib/po-sequence';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


const poItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
  applyTax: z.boolean(),
});

const poSchema = z.object({
  poNumber: z.string().min(1, 'PO Number is required'),
  date: z.date(),
  vendor: z.string().min(1, 'Vendor details are required'),
  projectName: z.string().min(1, 'Project Name is required'),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
  signatory1: z.string().optional(),
  signatory2: z.string().optional(),
});

const DEFAULT_TAX_RATE = 5; // 5%

export default function PurchaseOrderPage() {
  const { state: companyProfile } = useCompanyProfile();
  const router = useRouter();
  const { toast } = useToast();
  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');
  const [poNumber, setPoNumber] = useState('');

  useEffect(() => {
    const nextPoNumber = getNextPoNumber();
    setPoNumber(nextPoNumber);
  }, []);

  const form = useForm<z.infer<typeof poSchema>>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      poNumber: '',
      date: new Date(),
      vendor: '',
      projectName: '',
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, applyTax: false }],
      signatory1: companyProfile.signatories[0]?.id || '',
      signatory2: companyProfile.signatories[1]?.id || '',
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

  const watchedForm = useWatch({ control: form.control });
  const watchedItems = watchedForm.items || [];

  const calculateTotals = () => {
    const preTaxSubtotal = watchedItems.reduce((acc, item) => {
        return acc + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);

    const totalTax = watchedItems.reduce((acc, item) => {
        if (item.applyTax) {
            return acc + (item.quantity || 0) * (item.unitPrice || 0) * (DEFAULT_TAX_RATE / 100);
        }
        return acc;
    }, 0);
    
    const subtotalWithTax = preTaxSubtotal + totalTax;
    const grandTotal = preTaxSubtotal;

    return { subtotal: subtotalWithTax, totalTax, grandTotal };
  };

  const { subtotal, totalTax, grandTotal } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };
  
  const signatory1 = companyProfile.signatories.find(s => s.id === watchedForm.signatory1);
  const signatory2 = companyProfile.signatories.find(s => s.id === watchedForm.signatory2);
  
  const handleSubmit = (values: z.infer<typeof poSchema>) => {
     try {
        getNextPoNumber(true); // Increment and save the new PO number
        const poWithDateAsString = {
            ...values,
            date: values.date.toISOString(),
        }
        localStorage.setItem(`po_${values.poNumber}`, JSON.stringify(poWithDateAsString));
        toast({
            title: 'Purchase Order Saved',
            description: `PO ${values.poNumber} has been saved.`,
        });
        router.push(`/purchase-order/${values.poNumber}`);
     } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Saving PO',
            description: 'Could not save the purchase order to local storage.',
        });
     }
  };
  
  const getItemAmount = (item: z.infer<typeof poItemSchema>) => {
      const baseAmount = (item.quantity || 0) * (item.unitPrice || 0);
      if (item.applyTax) {
          return baseAmount * (1 + DEFAULT_TAX_RATE / 100);
      }
      return baseAmount;
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="New Purchase Order" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <DocumentToolbar />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
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
                  <h1 className="text-4xl font-bold font-headline text-primary mb-2">PURCHASE ORDER</h1>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span className="font-semibold">PO #</span><span>{poNumber}</span>
                    <span className="font-semibold">Date</span><span>{format(form.watch('date'), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
              </header>

              <section className="grid md:grid-cols-2 gap-x-8 mb-8">
                <FormField control={form.control} name="vendor" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">VENDOR:</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Vendor Name&#10;Vendor Address&#10;Vendor Contact" {...field} className="min-h-[80px]" />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="projectName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">PROJECT NAME:</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Office Renovation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </section>

              <section className="mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="w-[150px] text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Tax (5%)</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="no-print"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                            <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                <Input placeholder="Item description" {...field} />
                            )} />
                        </TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => <Input type="number" {...field} className="text-right" />} />
                        </TableCell>
                        <TableCell>
                          <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => <Input type="number" {...field} className="text-right w-full" />} />
                        </TableCell>
                        <TableCell className="text-center">
                            <FormField
                                control={form.control}
                                name={`items.${index}.applyTax`}
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-center">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                            />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getItemAmount(watchedItems[index]))}
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
                         <TableCell colSpan={4} className="text-right font-semibold">Withholding Tax (5%)</TableCell>
                         <TableCell className="text-right font-bold">({formatCurrency(totalTax)})</TableCell>
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
                    <Button type="button" variant="outline" onClick={() => append({ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, applyTax: false })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
              </section>

              <Separator className="my-8" />
              
              <footer className="space-y-4">
                 <div className="grid grid-cols-2 gap-8 pt-8 no-print">
                    <FormField control={form.control} name="signatory1" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorized Signatory 1</FormLabel>
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
                     <FormField control={form.control} name="signatory2" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authorized Signatory 2</FormLabel>
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
                 </div>
                 <div className="grid grid-cols-2 gap-8 pt-8 print-only">
                    <div className="pt-8 border-t border-dashed">
                        <p className="font-semibold">{signatory1?.name}</p>
                        <p className="text-sm text-muted-foreground">{signatory1?.title}</p>
                    </div>
                    <div className="pt-8 border-t border-dashed">
                        <p className="font-semibold">{signatory2?.name}</p>
                        <p className="text-sm text-muted-foreground">{signatory2?.title}</p>
                    </div>
                 </div>
                 <div className="text-center text-xs text-muted-foreground pt-4">
                    <p className='font-bold text-sm text-foreground'>{companyProfile.name}</p>
                    <p>{companyProfile.address}</p>
                    <p>
                        <span>{companyProfile.phone}</span> | <span>{companyProfile.email}</span> | <span>{companyProfile.website}</span>
                    </p>
                 </div>
              </footer>
              <div className="flex justify-end mt-8 no-print">
                    <Button type="submit">Save Purchase Order</Button>
               </div>
            </DocumentPage>
          </form>
        </Form>
      </main>
    </div>
  );
}
