'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { VendorLogo } from '@/components/vendor-logo';

const vendorSchema = z.object({
  name: z.string().min(1, 'Company Name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  tin: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  logoUrl: z.string().optional(),
  invoiceTemplate: z.string().optional(),
});

const invoiceTemplates = [
  { id: 'template-1', name: 'Classic Professional' },
  { id: 'template-2', name: 'Modern Minimalist' },
  { id: 'template-3', name: 'Bold & Creative' },
  { id: 'template-4', name: 'Elegant & Simple' },
  { id: 'template-5', name: 'Corporate Formal' },
];

export default function NewVendorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const form = useForm<z.infer<typeof vendorSchema>>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      tin: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
      logoUrl: '',
      invoiceTemplate: 'template-1',
    },
  });

  const handleSubmit = async (values: z.infer<typeof vendorSchema>) => {
    if (!firebaseUser) return;

    const token = await firebaseUser.getIdToken();

    try {
      const response = await fetch(`/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create vendor');
      }

      const newVendor = await response.json();

      toast({
        title: 'Vendor Created',
        description: `Vendor "${newVendor.name}" has been successfully created.`,
      });
      router.push(`/vendors/${newVendor.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Vendor',
        description: 'Could not create the vendor. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title="New Vendor" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="p-6 border rounded-lg">
                <div className="mb-4">
                    <VendorLogo logoUrl={form.watch('logoUrl')} companyName={form.watch('name')} />
                </div>
                <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem className="mt-4">
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. https://example.com/logo.png" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +1 234 567 890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123 Main St, Anytown USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. https://acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tin"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>TIN</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123-456-789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="p-6 border rounded-lg mt-4">
                <h3 className="text-lg font-medium">Bank Details</h3>
                <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                    <FormItem className="mt-4">
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. Chase Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                    <FormItem className="mt-4">
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                    <FormItem className="mt-4">
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. 1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="p-6 border rounded-lg mt-4">
                <h3 className="text-lg font-medium">Invoice Template</h3>
                <FormField
                    control={form.control}
                    name="invoiceTemplate"
                    render={({ field }) => (
                        <FormItem className="mt-4">
                            <FormLabel>Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a template" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {invoiceTemplates.map(template => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Create Vendor</Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}