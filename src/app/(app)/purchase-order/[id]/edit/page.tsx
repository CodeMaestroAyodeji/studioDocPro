'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Header } from '@/components/header';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { Vendor, PurchaseOrder, PurchaseOrderLineItem } from '@prisma/client';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
  total: z.coerce.number(),
});

const poSchema = z.object({
  orderDate: z.date(),
  deliveryDate: z.date().optional(),
  vendorId: z.string().min(1, 'Vendor is required'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  status: z.string(),
});

interface FullPurchaseOrder extends PurchaseOrder {
    vendor: Vendor;
    lineItems: PurchaseOrderLineItem[];
}

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [po, setPo] = useState<FullPurchaseOrder | null>(null);
  const poId = params.id as string;

  const form = useForm<z.infer<typeof poSchema>>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      orderDate: new Date(),
      vendorId: '',
      lineItems: [],
      notes: '',
      status: 'Draft',
    },
  });

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/vendors');
        if (!response.ok) throw new Error('Failed to fetch vendors');
        setVendors(await response.json());
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch vendors.' });
      }
    };

    const fetchPurchaseOrder = async () => {
      try {
        const response = await fetch(`/api/purchase-orders/${poId}`);
        if (!response.ok) throw new Error('Failed to fetch purchase order');
        const data: FullPurchaseOrder = await response.json();
        setPo(data);
        form.reset({
          ...data,
          orderDate: new Date(data.orderDate),
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
          vendorId: String(data.vendorId),
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch purchase order data.' });
      }
    };

    fetchVendors();
    if (poId) {
      fetchPurchaseOrder();
    }
  }, [poId, toast, form.reset]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const watchedItems = useWatch({ control: form.control, name: 'lineItems' });

  const calculateTotals = () => {
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const tax = subtotal * 0.10; // 10% tax
    const grandTotal = subtotal + tax;
    return { subtotal, tax, grandTotal };
  };

  const { subtotal, tax, grandTotal } = calculateTotals();

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleSubmit = async (values: z.infer<typeof poSchema>) => {
    try {
      const lineItemsWithTotals = values.lineItems.map(item => ({ ...item, total: item.quantity * item.unitPrice }));
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, vendorId: parseInt(values.vendorId, 10), lineItems: lineItemsWithTotals }),
      });

      if (!response.ok) throw new Error('Failed to update purchase order');

      const updatedPurchaseOrder = await response.json();
      toast({ title: 'Purchase Order Updated', description: `PO ${updatedPurchaseOrder.poNumber} has been updated.` });
      router.push(`/purchase-order/${updatedPurchaseOrder.id}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error Updating PO', description: 'Could not update the purchase order.' });
    }
  };

  if (!po) return <div>Loading...</div>;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Edit Purchase Order #${po.poNumber}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
          <Button type="submit" form="po-form">Save Changes</Button>
        </div>
        <Form {...form}>
          <form id="po-form" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="p-8 border rounded-lg">
                <section className="grid md:grid-cols-3 gap-x-8 mb-8">
                    <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="font-semibold text-muted-foreground">VENDOR</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a vendor" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {vendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={String(vendor.id)}>
                                {vendor.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="md:col-span-2 md:text-right space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <FormLabel className="font-semibold md:text-right md:col-start-3">Order Date:</FormLabel>
                            <FormField control={form.control} name="orderDate" render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                </Popover>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <FormLabel className="font-semibold md:text-right md:col-start-3">Delivery Date:</FormLabel>
                            <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                </Popover>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <FormLabel className="font-semibold md:text-right md:col-start-3">Status:</FormLabel>
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Sent">Sent</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Fulfilled">Fulfilled</SelectItem>
                                    </SelectContent>
                                </Select>
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
                        <TableRow key={index}>
                            <TableCell>
                            <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => <Input placeholder="Item description" {...field} />} />
                            </TableCell>
                            <TableCell>
                            <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => <Input type="number" {...field} className="text-right" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
                            </TableCell>
                            <TableCell>
                            <FormField control={form.control} name={`lineItems.${index}.unitPrice`} render={({ field }) => <Input type="number" {...field} className="text-right w-full" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />} />
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
                    <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, total: 0 })}>
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
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Subtotal:</span> <span className="font-medium">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Tax (10%):</span> <span className="font-medium">{formatCurrency(tax)}</span></div>
                        <hr/>
                        <div className="flex justify-between items-center text-lg font-bold text-primary"><span >Total:</span> <span>{formatCurrency(grandTotal)}</span></div>
                    </div>
                </section>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}