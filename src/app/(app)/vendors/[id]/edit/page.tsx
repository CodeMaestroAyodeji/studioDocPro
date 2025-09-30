
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import type { Vendor } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateAvatar } from '@/lib/vendor-utils';

const vendorSchema = z.object({
  id: z.string(),
  companyName: z.string().min(1, 'Company Name is required'),
  contactName: z.string().min(1, 'Contact Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  tin: z.string().optional(),
  logoUrl: z.string().optional(),
  invoiceTemplate: z.string().min(1, 'Please select a template'),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
});

const invoiceTemplates = [
  { id: 'template-1', name: 'Classic Professional' },
  { id: 'template-2', name: 'Modern Minimalist' },
  { id: 'template-3', name: 'Bold & Creative' },
  { id: 'template-4', name: 'Elegant & Simple' },
  { id: 'template-5', name: 'Corporate Formal' },
];

export default function EditVendorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  
  const form = useForm<z.infer<typeof vendorSchema>>({
    resolver: zodResolver(vendorSchema),
  });
  
  useEffect(() => {
    try {
      const storedVendor = localStorage.getItem(`vendor_${vendorId}`);
      if (storedVendor) {
        const parsed: Vendor = JSON.parse(storedVendor);
        setVendor(parsed);
        form.reset(parsed);
      } else {
        toast({ variant: 'destructive', title: 'Vendor not found' });
        router.push('/vendors');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading vendor' });
      router.push('/vendors');
    }
  }, [vendorId, router, toast, form]);

  const onSubmit = (values: z.infer<typeof vendorSchema>) => {
    try {
        localStorage.setItem(`vendor_${values.id}`, JSON.stringify(values));
        toast({
            title: 'Vendor Updated',
            description: `${values.companyName} has been updated.`,
        });
        router.push(`/vendors/${values.id}`);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error saving vendor' });
    }
  };

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('logoUrl', reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const logoUrl = form.watch('logoUrl');
  const companyName = form.watch('companyName');

  const logoPreview = logoUrl || (companyName ? generateAvatar(companyName) : '');

  if (!vendor) {
    return (
        <div className="flex flex-1 flex-col">
            <Header title="Loading..." />
            <main className="flex-1 p-6 text-center"><p>Loading vendor data...</p></main>
        </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Edit ${vendor.companyName}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print gap-2">
                <Button variant="outline" onClick={() => router.push(`/vendors/${vendorId}`)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </div>
            
            <div className="grid gap-8">
                <Card>
                <CardHeader><CardTitle>Vendor Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="companyName" render={({ field }) => (
                        <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="contactName" render={({ field }) => (
                        <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="website" render={({ field }) => (
                        <FormItem><FormLabel>Website (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="tin" render={({ field }) => (
                        <FormItem><FormLabel>TIN (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    </div>
                </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Branding & Template</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            {logoPreview && (
                                <Image 
                                src={logoPreview} 
                                alt="Vendor Logo"
                                width={80}
                                height={80}
                                className="rounded-md object-cover border p-1"
                                />
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            <Button variant="outline" type="button" onClick={handleLogoUploadClick}>Upload Logo</Button>
                        </div>
                        <FormField control={form.control} name="invoiceTemplate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Invoice Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {invoiceTemplates.map(template => (
                                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    </CardContent>
                </Card>

                <Card>
                <CardHeader><CardTitle>Bank Details (Optional)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="bankName" render={({ field }) => (
                        <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="accountName" render={({ field }) => (
                        <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="accountNumber" render={({ field }) => (
                        <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                </CardContent>
                </Card>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
