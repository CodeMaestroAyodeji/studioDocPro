'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useMemo } from 'react';
import type { Vendor, PurchaseOrder } from '@prisma/client';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useCompanyProfile } from '@/contexts/company-profile-context';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  taxable: z.boolean().optional(),
});

const poSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  projectName: z.string().min(1, 'Project name is required'),
  orderDate: z.date(),
  deliveryDate: z.date().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

type POFormValues = z.infer<typeof poSchema>;

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { firebaseUser } = useAuth();
  const { state: companyProfile } = useCompanyProfile();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  const form = useForm<POFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      orderDate: new Date(),
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, taxable: false }],
      notes: '',
    },
  });

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      if (!firebaseUser || !id) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/purchase-orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseOrder(data);
        form.reset({
          ...data,
          vendorId: String(data.vendorId),
          orderDate: new Date(data.orderDate),
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        });
      } else {
        console.error('Failed to fetch purchase order');
      }
      setLoading(false);
    };

    fetchPurchaseOrder();
  }, [firebaseUser, id, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const watchedItems = useWatch({ control: form.control, name: 'lineItems' });

  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const taxableSubtotal = watchedItems
        .filter(item => item.taxable)
        .reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
    
    const tax = taxableSubtotal / 21;
    const total = subtotal - tax;
    return { subtotal, tax, total };
  }, [watchedItems]);

  useEffect(() => {
    const fetchVendors = async () => {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/vendors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    };
    fetchVendors();
  }, [firebaseUser]);

  const onSubmit = async (data: POFormValues) => {
    if (!firebaseUser || !purchaseOrder) return;
    const token = await firebaseUser.getIdToken();

    const body = {
      ...data,
      poNumber: purchaseOrder.poNumber,
    };

    const response = await fetch(`/api/purchase-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      router.push(`/purchase-order/${id}`);
    } else {
      // Handle error
      console.error('Failed to update purchase order');
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Edit Purchase Order" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="p-8 border rounded-lg">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="font-bold text-2xl">{companyProfile.name}</h2>
                        <p className="text-muted-foreground">{companyProfile.address}</p>
                    </div>
                    <h2 className="font-bold text-3xl text-primary">Purchase Order</h2>
                </div>

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
                    <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="font-semibold text-muted-foreground">PROJECT</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Project name" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="md:col-span-1 md:text-right space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-sm">
                            <FormLabel className="font-semibold md:text-right">Order Date:</FormLabel>
                            <FormField control={form.control} name="orderDate" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                    <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-sm">
                            <FormLabel className="font-semibold md:text-right">Delivery Date:</FormLabel>
                            <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                    <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
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
                        <TableHead>Taxable</TableHead>
                        <TableHead className="no-print"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                        <TableRow key={field.id}>
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
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.taxable`}
                                render={({ field }) => (
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                )}
                              />
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
                    <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxable: false })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes / Terms</FormLabel>
                                <FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Subtotal:</span> <span className="font-medium">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Tax (-5%):</span> <span className="font-medium">{formatCurrency(tax)}</span></div>
                        <hr/>
                        <div className="flex justify-between items-center text-lg font-bold text-primary"><span >Total:</span> <span>{formatCurrency(total)}</span></div>
                    </div>
                </section>
            </div>

            <Button type="submit">Update Purchase Order</Button>
          </form>
        </Form>
      </main>
    </div>
  );
}