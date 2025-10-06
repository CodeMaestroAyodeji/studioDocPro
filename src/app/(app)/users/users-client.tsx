
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
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

// This component now receives the initial list of users as a prop.
// The AppUser type from the old mock data might be slightly different from the Prisma User type.
// We'll cast the Prisma users to a compatible type for now.
type UserForClient = Omit<User, 'lastSignInTime'> & { lastSignInTime: string | Date | null };

const roles: UserRole[] = ["Admin", "Project Manager", "Accountant"];

export function UsersClient({ initialUsers }: { initialUsers: UserForClient[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserForClient[]>(initialUsers);
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<UserForClient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>( '');

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
    // To implement user invites, you would:
    // 1. Create a dialog with a form to capture the new user's email and role.
    // 2. On form submission, make a POST request to the `/api/users` endpoint.
    // 3. The backend would then:
    //    a. Create the user in Firebase Authentication.
    //    b. Firebase would send an invitation/welcome email.
    //    c. Create the user in the local Prisma database.
    // 4. On the client, you would then update the user list with the new user.
    alert('Feature to invite a new user is not yet implemented.');
  };
  
  const handleEditUser = (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setSelectedRole(userToEdit.role as UserRole || '');
      setIsEditDialogOpen(true);
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!firebaseUser) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to delete users.' });
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user.');
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      toast({ title: 'User Deleted', description: 'The user has been successfully deleted.' });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  }

  const handleRoleUpdate = async () => {
    if (!firebaseUser || !editingUser || !selectedRole) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid request.' });
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update role.');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u));
      toast({ title: 'Role Updated', description: `Role for ${editingUser.name} updated to ${selectedRole}.` });
      setIsEditDialogOpen(false);
      setEditingUser(null);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Delete User</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user and their data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Edit Role for {editingUser?.name}</DialogTitle>
                <DialogDescription>
                    Select a new role for the user.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRoleUpdate}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
