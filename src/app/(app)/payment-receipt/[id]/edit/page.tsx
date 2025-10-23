// src/app/(app)/payment-receipt/[id]/edit/page.tsx

'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { useAuth } from '@/contexts/auth-context';
import { SalesInvoice, Client, PaymentReceipt } from '@prisma/client';

const receiptSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  paymentDate: z.date(),
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
  salesInvoices: z.array(z.number()).optional(),
  receivingBankId: z.string().optional(),
  issuedById: z.string().optional(),
});

export default function EditPaymentReceiptPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;
  const { firebaseUser } = useAuth();

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof receiptSchema>>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      clientId: '',
      paymentDate: new Date(),
      amount: 0,
      paymentMethod: 'Bank Transfer',
      notes: 'Thank you for your business.',
      salesInvoices: [],
      receivingBankId: companyProfile.bankAccounts[0]?.id || '',
      issuedById: companyProfile.signatories[0]?.id || '',
    },
  });

  // Fetch Clients & Invoices
  useEffect(() => {
    const fetchClients = async () => {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setClients(await res.json());
    };

    const fetchInvoices = async () => {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/sales-invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInvoices(await res.json());
    };

    fetchClients();
    fetchInvoices();
  }, [firebaseUser]);

  // Fetch receipt details
  useEffect(() => {
    let isMounted = true;
    const fetchReceipt = async () => {
      if (!firebaseUser || !receiptId) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/payment-receipts/${receiptId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (isMounted) {
        if (response.ok) {
          const data = await response.json();
          setReceipt(data);
          form.reset({
            ...data,
            paymentDate: new Date(data.paymentDate),
            clientId: data.clientId?.toString?.() || '',
            salesInvoices: data.salesInvoices?.map((inv: any) => inv.id) || [],
            receivingBankId: data.receivingBankId || '',
            issuedById: data.issuedById || '',
          });
        } else {
          toast({ variant: 'destructive', title: 'Receipt not found' });
          router.push('/payment-receipt');
        }
        setLoading(false);
      }
    };

    fetchReceipt();
    return () => {
      isMounted = false;
    };
  }, [receiptId, router, toast, firebaseUser, form]);

  // Watch for selected client
  const selectedClientId = form.watch('clientId');

  // Filter invoices by client (same as create form)
  const filteredInvoiceOptions = useMemo(
    () =>
      invoices
        .filter((inv) => inv.clientId?.toString() === selectedClientId)
        .map((inv) => ({
          label: `${inv.invoiceNumber} - ${inv.client?.name || 'Unknown Client'}`,
          value: inv.id.toString(),
        })),
    [invoices, selectedClientId]
  );

  const handleSubmit = async (values: z.infer<typeof receiptSchema>) => {
    if (!firebaseUser || !receiptId) return;
    const token = await firebaseUser.getIdToken();

    try {
      const response = await fetch(`/api/payment-receipts/${receiptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          clientId: parseInt(values.clientId, 10),
        }),
      });

      if (response.ok) {
        toast({ title: 'Receipt updated successfully' });
        router.push(`/payment-receipt/${receiptId}`);
      } else {
        toast({ variant: 'destructive', title: 'Failed to update receipt' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update receipt' });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Edit Payment Receipt" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
          <Button type="submit" form="receipt-form">
            Save Changes
          </Button>
        </div>
        <Form {...form}>
          <form id="receipt-form" onSubmit={form.handleSubmit(handleSubmit)}>
            <DocumentPage>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem
                              key={client.id}
                              value={client.id.toString()}
                            >
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, 'dd/MM/yyyy')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Received (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="text-2xl h-12 font-bold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border rounded-lg p-4 space-y-4 mb-8">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">
                              Bank Transfer
                            </SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                            <SelectItem value="POS">POS</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salesInvoices"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>For Invoice # (Requires Client Selection)</FormLabel>
                        <Combobox
                          options={filteredInvoiceOptions}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder={
                            selectedClientId
                              ? 'Select invoices for this client'
                              : 'Select a client first'
                          }
                          searchPlaceholder="Search invoices..."
                          emptyMessage={
                            selectedClientId
                              ? 'No invoices found for this client.'
                              : 'Please select a client first.'
                          }
                          multiple
                          disabled={!selectedClientId}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receivingBankId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receiving Bank</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={companyProfile.bankAccounts.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyProfile.bankAccounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.bankName} - {acc.accountNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuedById"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issued By</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={companyProfile.signatories.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select signatory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyProfile.signatories.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} - {s.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Part payment for construction materials"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </DocumentPage>
          </form>
        </Form>
      </main>
    </div>
  );
}
