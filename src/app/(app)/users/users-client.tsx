
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import type { AppUser, UserRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { User } from '@prisma/client';

// This component now receives the initial list of users as a prop.
// The AppUser type from the old mock data might be slightly different from the Prisma User type.
// We'll cast the Prisma users to a compatible type for now.
type UserForClient = Omit<User, 'lastSignInTime'> & { lastSignInTime: string | Date | null };


export function UsersClient({ initialUsers }: { initialUsers: UserForClient[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // The user list is now managed by this component, starting with the server-fetched data.
  const [users, setUsers] = useState<UserForClient[]>(initialUsers);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(
      (user) =>
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'Admin':
        return 'destructive';
      case 'Accountant':
        return 'default';
      case 'Project Manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleInviteUser = () => {
    // Placeholder for future functionality
    alert('Feature to invite a new user is not yet implemented.');
  };
  
  const handleEditUser = (userId: number) => {
     alert(`Editing user ${userId} is not yet implemented.`);
  }

  const handleDeleteUser = (userId: number) => {
     alert(`Deleting user ${userId} is not yet implemented.`);
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
             <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage your team members and their roles.</CardDescription>
             </div>
             <Button onClick={handleInviteUser}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite User
            </Button>
        </div>
         <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 sm:w-1/2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Signed In</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role || 'No Role'}</Badge>
                  </TableCell>
                  <TableCell>{user.lastSignInTime ? format(new Date(user.lastSignInTime), "dd MMM yyyy, p") : 'Never'}</TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user.id)}>Edit Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
