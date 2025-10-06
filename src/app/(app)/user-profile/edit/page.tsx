// src/app/(app)/user-profile/edit/page.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  updateProfile,
  updateEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { auth, storage } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User as UserIcon, Mail, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function UserProfileEditPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const profileSchema = z.object({
    name: z.string().min(1, "Full name is required"),
    photoURL: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
  });

  const emailSchema = z.object({
    email: z.string().email("Invalid email address"),
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      photoURL: user?.photoURL || "",
    },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        photoURL: user.photoURL || "",
      });
      emailForm.reset({
        email: user.email || "",
      });
    }
  }, [user, profileForm, emailForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      // Update Firebase user profile first
      await updateProfile(auth.currentUser, {
        displayName: values.name,
        photoURL: values.photoURL || null,
      });
      // Get a fresh ID token after update — use true to force refresh
      const token = await auth.currentUser.getIdToken(true);

      // Now update the backend database with the authenticated request
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: values.name,
          photoURL: values.photoURL || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile on server");

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // Refresh local data - your AuthProvider will refetch /api/users/me on token change or we can force refresh
      router.refresh(); // Re-fetches user data
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update your profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      // Send verification link to the new email
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Verify New Email",
        description:
          "A verification link has been sent to your new email. Please verify before updating.",
      });
    } catch (error: any) {
      console.error("[EMAIL_UPDATE]", error);
      toast({
        variant: "destructive",
        title: "Email Update Failed",
        description: error.message || "Could not send verification email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Password Reset Email Sent",
        description: `A reset link has been sent to ${user.email}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: "Could not send password reset email.",
      });
    }
  };

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      try {
        console.log("Uploading file:", file.name);
        const storageRef = ref(storage, `profile-pictures/${user.id}`);
        const uploadResult = await uploadBytes(storageRef, file);
        console.log("Upload result:", uploadResult);
        const downloadURL = await getDownloadURL(storageRef);
        console.log("Download URL:", downloadURL);
        profileForm.setValue("photoURL", downloadURL, {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast({
          title: "Photo Uploaded",
          description: "Your new profile photo is ready to be saved.",
        });
      } catch (error) {
        console.error("[UPLOAD_ERROR]", error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Could not upload your photo. Please try again.",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const photoURL = profileForm.watch("photoURL");

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
            <Button
              variant="outline"
              onClick={() => router.push("/user-profile")}
            >
              Cancel
            </Button>
            <Button
              onClick={() => router.push("/user-profile")}
              variant="secondary"
            >
              View Updated Profile
            </Button>
          </div>

          <Form {...profileForm}>
            <form
              id="profile-form"
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Public Profile</CardTitle>
                  <CardDescription>
                    This information may be visible to other members of your
                    team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        {photoURL && (
                          <AvatarImage
                            src={photoURL}
                            alt={user.name || "User"}
                          />
                        )}
                        <AvatarFallback>
                          {user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || <UserIcon />}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <Button
                        variant="outline"
                        type="button"
                        onClick={handleLogoUploadClick}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Upload Photo"}
                      </Button>
                    </div>
                  </FormItem>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button
                    type="submit"
                    form="profile-form"
                    disabled={isSubmitting || !profileForm.formState.isDirty}
                  >
                    {isSubmitting ? "Saving..." : "Save Profile Changes"}
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
                <form
                  id="email-form"
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-4"
                >
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Change Email Address</AlertTitle>
                    <AlertDescription>
                      Changing your email requires re-authentication. For
                      security, you will be logged out.
                    </AlertDescription>
                  </Alert>
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <Button
                            type="submit"
                            form="email-form"
                            disabled={
                              isSubmitting || !emailForm.formState.isDirty
                            }
                          >
                            Update Email
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              <Separator />

              <div>
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Change Password</AlertTitle>
                  <AlertDescription>
                    We will send a password reset link to your registered email
                    address.
                  </AlertDescription>
                </Alert>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="mt-4">
                      Send Password Reset Link
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Confirm Password Reset
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send a password reset link to{" "}
                        <strong>{user.email}</strong>. Are you sure you want to
                        proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePasswordReset}>
                        Send Link
                      </AlertDialogAction>
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
