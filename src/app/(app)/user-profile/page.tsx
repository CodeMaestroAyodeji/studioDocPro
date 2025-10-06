
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Pencil, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ProfileViewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const DetailItem = ({ label, value }: { label: string; value: string | undefined | null }) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base">{value || '-'}</p>
    </div>
  );

  if (loading) {
    return (
        <div className="flex flex-1 flex-col">
            <Header title="User Profile" />
            <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
                <p>Loading profile...</p>
            </main>
        </div>
    )
  }

  if (!user) {
    return (
        <div className="flex flex-1 flex-col">
            <Header title="User Profile" />
            <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8 text-center">
                <p>Please log in to view your profile.</p>
                <Button onClick={() => router.push('/login')}>Go to Login</Button>
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="My Profile" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
        <div className="flex justify-end sticky top-[57px] sm:top-0 z-10 py-2 bg-background no-print">
            <Button onClick={() => router.push('/user-profile/edit')}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
            </Button>
        </div>
        
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-6">
                 <Avatar className="h-20 w-20">
                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name || 'User'} />}
                    <AvatarFallback className="text-2xl">
                        {user.name?.split(' ').map(n => n[0]).join('') || <UserIcon />}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-3xl">{user.name}</CardTitle>
                    <CardDescription>{user.email} &bull; <span className="font-medium">{user.role}</span></CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <DetailItem label="Full Name" value={user.name} />
              <DetailItem label="Email Address" value={user.email} />
              <DetailItem label="Role" value={user.role} />
              <DetailItem label="Last Signed In" value={user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString() : 'N/A'} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
