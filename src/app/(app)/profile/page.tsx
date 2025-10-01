
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';

const signatorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
});

const bankAccountSchema = z.object({
  id: z.string(),
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
});

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.string().min(1, 'Address is required'),
  tin: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Logo is required').min(1, 'Logo is required'),
  signatories: z.array(signatorySchema),
  bankAccounts: z.array(bankAccountSchema),
});

export default function ProfilePage() {
  const { state, dispatch } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ...state,
      tin: state.tin || '',
      website: state.website || '',
    },
  });

  const { fields: signatoryFields, append: appendSignatory, remove: removeSignatory } = useFieldArray({
    control: form.control,
    name: 'signatories',
  });

  const { fields: bankAccountFields, append: appendBankAccount, remove: removeBankAccount } = useFieldArray({
    control: form.control,
    name: 'bankAccounts',
  });

  useEffect(() => {
    form.reset({
      ...state,
      tin: state.tin || '',
      website: state.website || '',
    });
  }, [state, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    dispatch({ type: 'SET_PROFILE', payload: values });
    toast({
      title: 'Profile Updated',
      description: 'Your company profile has been saved successfully.',
    });
    router.push('/profile/view');
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

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Company Profile" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
                 <Button type="submit">Save Changes</Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Manage your company's core information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <Image 
                      src={logoUrl} 
                      alt="Company Logo"
                      width={150}
                      height={50}
                      className="rounded-md object-contain border p-1"
                    />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <Button variant="outline" type="button" onClick={handleLogoUploadClick}>Upload Logo</Button>
                </div>
                 <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem className="hidden"><FormLabel>Logo URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="tin" render={({ field }) => (
                    <FormItem><FormLabel>TIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                     <FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>Signatories</CardTitle>
                <CardDescription>Add or remove authorized signatories for your documents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {signatoryFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4">
                    <FormField control={form.control} name={`signatories.${index}.name`} render={({ field }) => (
                      <FormItem className="flex-1"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`signatories.${index}.title`} render={({ field }) => (
                      <FormItem className="flex-1"><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSignatory(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendSignatory({ id: crypto.randomUUID(), name: '', title: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Signatory
                </Button>
              </CardContent>
            </Card>
            
            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Manage bank accounts for payment processing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bankAccountFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 items-end gap-4">
                     <FormField control={form.control} name={`bankAccounts.${index}.bankName`} render={({ field }) => (
                      <FormItem className="md:col-span-1"><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name={`bankAccounts.${index}.accountName`} render={({ field }) => (
                      <FormItem className="md:col-span-1"><FormLabel>Account Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`bankAccounts.${index}.accountNumber`} render={({ field }) => (
                      <FormItem className="md:col-span-1"><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeBankAccount(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendBankAccount({ id: crypto.randomUUID(), bankName: '', accountName: '', accountNumber: '' })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Bank Account
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </main>
    </div>
  );
}
