
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { format, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { VendorInvoice, Vendor } from '@/lib/types';
import { getNextVendorInvoiceNumber } from '@/lib/vendor-invoice-sequence';
import { getVendors } from '@/lib/vendor-utils';
import { Combobox } from '@/components/ui/combobox';
import { InvoiceTemplate1 } from '@/components/vendor-invoice-templates/template-1';
import { InvoiceTemplate2 } from '@/components/vendor-invoice-templates/template-2';
import { InvoiceTemplate3 } from '@/components/vendor-invoice-templates/template-3';
import { InvoiceTemplate4 } from '@/components/vendor-invoice-templates/template-4';
import { InvoiceTemplate5 } from '@/components/vendor-invoice-templates/template-5';
import { cn } from '@/lib/utils';

const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  rate: z.coerce.number().min(0, 'Cannot be negative'),
  discount: z.coerce.number().min(0).optional(),
  tax: z.boolean(),
});

const invoiceSchema = z.object({
  id: z.string(),
  vendorId: z.string().min(1, 'Please select a vendor'),
  projectName: z.string().min(1, 'Project name is required'),
  invoiceNumber: z.string(),
  invoiceDate: z.date(),
  dueDate: z.date(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

type StoredVendorInvoice = Omit<VendorInvoice, 'invoiceDate' | 'dueDate'> & { invoiceDate: string, dueDate: string };

const TAX_RATE = 7.5; // 7.5% VAT

export default function NewVendorInvoicePage() {
  const { state: companyProfile } = useCompanyProfile();
  const router = useRouter();
  const { toast } = useToast();
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    setVendors(getVendors());
  }, []);

  const vendorOptions = useMemo(() => 
    vendors.map(v => ({ label: v.companyName, value: v.id })),
  [vendors]);

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      id: crypto.randomUUID(),
      vendorId: '',
      projectName: '',
      invoiceNumber: '',
      invoiceDate: new Date(),
      dueDate: addDays(new Date(), 14),
      items: [{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, discount: 0, tax: true }],
      notes: '',
    },
  });

  const selectedVendorId = useWatch({ control: form.control, name: 'vendorId' });
  const selectedVendor = useMemo(() => vendors.find(v => v.id === selectedVendorId), [vendors, selectedVendorId]);

  useEffect(() => {
    if (selectedVendor) {
      const nextInvoiceNumber = getNextVendorInvoiceNumber(selectedVendor.companyName, true);
      setInvoiceNumber(nextInvoiceNumber);
      form.setValue('invoiceNumber', nextInvoiceNumber);
    } else {
        setInvoiceNumber('');
        form.setValue('invoiceNumber', '');
    }
  }, [selectedVendor, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const { subtotal, totalDiscount, totalTax, grandTotal } = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    (watchedItems || []).forEach(item => {
      const amount = (item.quantity || 0) * (item.rate || 0);
      const discount = item.discount || 0;
      subtotal += amount;
      totalDiscount += discount;
      if (item.tax) {
        totalTax += (amount - discount) * (TAX_RATE / 100);
      }
    });

    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  }, [watchedItems]);

  const handleSubmit = (values: z.infer<typeof invoiceSchema>) => {
    try {
      const invoiceWithDateAsString: StoredVendorInvoice = {
        ...values,
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };
      localStorage.setItem(`vendor_invoice_${values.id}`, JSON.stringify(invoiceWithDateAsString));
      toast({
        title: 'Invoice Saved',
        description: `Invoice ${values.invoiceNumber} has been saved.`,
      });
      router.push(`/vendor-invoice/${values.id}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error Saving Invoice' });
    }
  };

  const renderTemplatePreview = () => {
    if (!selectedVendor) return <div className="border rounded-lg p-8 text-center text-muted-foreground">Select a vendor to see a preview</div>;
    
    const templateProps = {
      vendor: selectedVendor,
      invoice: form.getValues(),
      companyProfile,
      isEditing: true,
      form,
      watchedItems,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      fields,
      append,
      remove
    };

    switch (selectedVendor.invoiceTemplate) {
      case 'template-1': return <InvoiceTemplate1 {...templateProps} />;
      case 'template-2': return <InvoiceTemplate2 {...templateProps} />;
      case 'template-3': return <InvoiceTemplate3 {...templateProps} />;
      case 'template-4': return <InvoiceTemplate4 {...templateProps} />;
      case 'template-5': return <InvoiceTemplate5 {...templateProps} />;
      default: return <InvoiceTemplate1 {...templateProps} />;
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title="New Vendor Invoice" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
          <Button type="submit" form="invoice-form" disabled={!selectedVendor}>Save Invoice</Button>
        </div>
        <Form {...form}>
          <form id="invoice-form" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                   <FormField
                        control={form.control}
                        name="vendorId"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Vendor</FormLabel>
                            <Combobox
                                options={vendorOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select a vendor"
                                searchPlaceholder="Search vendors..."
                                emptyMessage="No vendors found."
                            />
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField control={form.control} name="projectName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Invoice Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )} />
                        <FormField control={form.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )} />
                     </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Invoice Note (Optional)</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                        </FormItem>
                     )} />
                </div>
                <div className="lg:col-span-2">
                    <DocumentPage>
                        {renderTemplatePreview()}
                    </DocumentPage>
                </div>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
