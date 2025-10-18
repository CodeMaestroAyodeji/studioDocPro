'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { Vendor } from '@/lib/types';

const vendorSchema = z.object({
  name: z.string().min(1, 'Company Name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export default function EditVendorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
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

  useEffect(() => {
    if (!firebaseUser || !vendorId) return;

    const fetchVendor = async () => {
      const token = await firebaseUser.getIdToken();
      try {
        const response = await fetch(`/api/vendors/${vendorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch vendor');
        }
        const data: Vendor = await response.json();
        const transformedData = {
            ...data,
            contactName: data.contactName || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
        };
        form.reset(transformedData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error loading vendor' });
        router.push('/vendors');
      }
    };

    fetchVendor();
  }, [vendorId, router, toast, firebaseUser, form]);

  const handleSubmit = async (values: z.infer<typeof vendorSchema>) => {
    if (!firebaseUser) return;

    const token = await firebaseUser.getIdToken();

    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor');
      }

      const updatedVendor = await response.json();

      toast({
        title: 'Vendor Updated',
        description: `Vendor "${updatedVendor.name}" has been successfully updated.`,
      });
      router.push(`/vendors/${vendorId}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Vendor',
        description: 'Could not update the vendor. Please try again.',
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Edit Vendor" />
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
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}