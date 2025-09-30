
'use client';

import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from './ui/sidebar';

export function UserProfileButton() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // useSidebar is now optional. It will be null if not in a SidebarProvider.
  const sidebar = useSidebar();
  const sidebarState = sidebar?.state;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was an error logging you out.',
      });
    }
  };

  if (!user) {
    return null;
  }
  
  const userInitials = user.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('') || <UserIcon className="h-5 w-5" />;


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2">
            <Avatar className="h-8 w-8">
              {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate font-medium">{user.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align={sidebarState === 'collapsed' ? 'start' : 'end'}>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
