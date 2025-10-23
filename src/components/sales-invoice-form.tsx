'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/contexts/auth-context';
import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Client } from '@prisma/client';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { calculateTotals } from '@/lib/finance-utils';

const lineItemSchema = z.object({
  id: z.any().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be at least 0.01'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  issueDate: z.date(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').optional(),
  addVat: z.boolean().optional(),
  preparedById: z.string().optional(),
  approvedById: z.string().optional(),
  bankAccountId: z.string().optional(),
  status: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface SalesInvoiceFormProps {
  initialValues?: Partial<InvoiceFormValues>;
  onSubmit: (data: InvoiceFormValues) => Promise<void>;
  isEditing?: boolean;
}

export function SalesInvoiceForm({ initialValues, onSubmit, isEditing = false }: SalesInvoiceFormProps) {
  const { firebaseUser } = useAuth();
  const { state: companyProfile } = useCompanyProfile();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialValues || {
      clientId: '',
      issueDate: new Date(),
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: '',
      discount: 0,
      addVat: false,
      preparedById: '',
      approvedById: '',
      bankAccountId: '',
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });

  const watchedLineItems = useWatch({ control: form.control, name: 'lineItems' });
  const watchedDiscount = useWatch({ control: form.control, name: 'discount' });
  const watchedAddVat = useWatch({ control: form.control, name: 'addVat' });

  const { subtotal, discountAmount, tax, total } = useMemo(() => {
    return calculateTotals(watchedLineItems, watchedDiscount, watchedAddVat);
  }, [watchedLineItems, watchedDiscount, watchedAddVat]);

  // 📡 Fetch clients
  const fetchClients = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      } else throw new Error('Failed to load clients');
    } catch (e) {
      toast.error('Error loading clients');
    }
  }, [firebaseUser]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ➕ Create new client
  const handleCreateClient = async () => {
    if (!firebaseUser || !newClientName) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newClientName }),
      });

      if (!res.ok) throw new Error('Failed to create client');

      const newClient = await res.json();
      await fetchClients();
      form.setValue('clientId', String(newClient.id));
      setNewClientName('');
      setIsAddClientDialogOpen(false);
      toast.success(`Client "${newClient.name}" added`);
    } catch (e) {
      toast.error('Error creating client');
    }
  };

  const handleFormSubmit = async (data: InvoiceFormValues) => {
    setLoading(true);
    await onSubmit(data);
    setLoading(false);
  };

  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-10">
          {/* CLIENT SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={String(client.id)}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" size="icon" onClick={() => setIsAddClientDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* LINE ITEMS */}
          <div>
            <h3 className="text-lg font-medium mb-3">Line Items</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 mb-2">
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Input {...field} placeholder="Description" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <Input {...field} type="number" placeholder="Qty" className="w-20" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <Input {...field} type="number" placeholder="Unit Price" className="w-28" />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
          </div>

          {/* TOTAL SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Add any notes..." />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div>
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center">
                    <FormLabel>Discount (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" className="w-24" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-between"><span>Total before Tax</span><span>{(subtotal - discountAmount).toFixed(2)}</span></div>
              <FormField
                control={form.control}
                name="addVat"
                render={({ field }) => (
                  <FormItem className="flex justify-between items-center">
                    <FormLabel>Add VAT (7.5%)</FormLabel>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />
              <div className="flex justify-between"><span>VAT</span><span>{tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span><span>{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SIGNATORIES + BANK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['preparedById', 'approvedById', 'bankAccountId'].map((fieldName, idx) => {
              const labelMap: Record<string, string> = {
                preparedById: 'Prepared By',
                approvedById: 'Approved By',
                bankAccountId: 'Bank Account',
              };
              const dataSource = fieldName === 'bankAccountId'
                ? companyProfile?.bankAccounts || []
                : companyProfile?.signatories || [];

              return (
                <FormField
                  key={idx}
                  control={form.control}
                  name={fieldName as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{labelMap[fieldName]}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${labelMap[fieldName]}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dataSource.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {fieldName === 'bankAccountId'
                                ? `${item.bankName} - ${item.accountNumber}`
                                : item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Invoice')}
            </Button>
          </div>
        </form>
      </Form>

      {/* ADD CLIENT DIALOG */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Client Name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateClient}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
