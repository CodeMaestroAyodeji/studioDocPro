'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

const vendorSchema = z.object({
  name: z.string().min(1, 'Company Name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

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
    },
  });

  const handleSubmit = async (values: z.infer<typeof vendorSchema>) => {
    if (!firebaseUser) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to create a vendor.',
        });
        return;
    }

    const token = await firebaseUser.getIdToken();

    try {
      const response = await fetch('/api/vendors', {
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
      router.push('/vendors');
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
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Vendor</Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}