
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { updateProfile, updateEmail, sendPasswordResetEmail } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, ShieldCheck } from 'lucide-react';
import { User as UserIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  photoURL: z.string().optional(),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function EditProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      photoURL: user?.photoURL || '',
    },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
        email: user?.email || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
      emailForm.reset({
        email: user.email || '',
      });
    }
  }, [user, form, emailForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in' });
        return;
    }
    setIsSubmitting(true);
    try {
      await updateProfile(user, {
        displayName: values.displayName,
        photoURL: values.photoURL || null,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your name and profile picture have been updated.',
      });
      router.push('/user-profile');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!user || !auth.currentUser) {
        toast({ variant: 'destructive', title: 'You must be logged in' });
        return;
    }
    setIsSubmitting(true);
    try {
      await updateEmail(auth.currentUser, values.email);
      toast({
        title: 'Email Update Requested',
        description: 'Your email has been updated. You may need to re-login.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'This action requires a recent login. Please log out and log back in to change your email.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No email address found for your account.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `A link to reset your password has been sent to ${user.email}.`,
      });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: error.message });
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
        form.setValue('photoURL', reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const photoURL = form.watch('photoURL');

  if (!user) {
    return (
        <div className="flex-1 p-6 text-center">
          <p>Loading profile...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Edit Profile" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0">
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print gap-2">
                <Button variant="outline" onClick={() => router.push('/user-profile')}>Cancel</Button>
            </div>
            
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>This information may be visible to other members of your team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="displayName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        {photoURL && <AvatarImage src={photoURL} alt={user.displayName || 'User'} />}
                        <AvatarFallback>
                            {user.displayName?.split(' ').map(n => n[0]).join('') || <UserIcon />}
                        </AvatarFallback>
                    </Avatar>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <Button variant="outline" type="button" onClick={handleLogoUploadClick}>Upload Photo</Button>
                  </div>
                </FormItem>
              </CardContent>
              <div className="p-6 pt-0">
                <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </Card>
            </form>
            </Form>

            <Separator />

            <Card>
                <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                    <CardDescription>Manage your email and password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                        <Alert>
                            <Mail className="h-4 w-4" />
                            <AlertTitle>Change Email Address</AlertTitle>
                            <AlertDescription>
                                Changing your email requires re-authentication. For security, you may be logged out.
                            </AlertDescription>
                        </Alert>
                         <FormField control={emailForm.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <div className="flex gap-2">
                                <FormControl><Input {...field} type="email" /></FormControl>
                                <Button type="submit" disabled={isSubmitting || !emailForm.formState.isDirty}>Update Email</Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </form>
                   </Form>
                   
                   <Separator />

                   <div>
                     <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertTitle>Change Password</AlertTitle>
                        <AlertDescription>
                            We will send a password reset link to your registered email address.
                        </AlertDescription>
                    </Alert>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="mt-4">Send Password Reset Link</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Password Reset</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will send a password reset link to <strong>{user.email}</strong>. Are you sure you want to proceed?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handlePasswordReset}>Send Link</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                   </div>

                </CardContent>
            </Card>

        </div>
      </main>
    </div>
  );
}
