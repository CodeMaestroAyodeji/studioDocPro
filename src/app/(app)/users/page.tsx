export const dynamic = 'force-dynamic';

import db from '@/lib/prisma';
import { Header } from '@/components/header';
import { UsersClient } from './users-client';
import type { AppUser } from '@/lib/types';

// The original mock data, to be used for seeding if the DB is empty.
const mockUsers: Omit<AppUser, 'uid'>[] = [
  {
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'Admin',
    lastSignInTime: new Date('2024-07-30T10:00:00Z').toISOString(),
    photoURL: 'https://picsum.photos/seed/1/40/40'
  },
  {
    email: 'accountant@example.com',
    displayName: 'Accountant User',
    role: 'Accountant',
    lastSignInTime: new Date('2024-07-29T14:30:00Z').toISOString(),
     photoURL: 'https://picsum.photos/seed/2/40/40'
  },
  {
    email: 'manager@example.com',
    displayName: 'Project Manager',
    role: 'Project Manager',
    lastSignInTime: new Date('2024-07-30T09:00:00Z').toISOString(),
     photoURL: 'https://picsum.photos/seed/3/40/40'
  },
   {
    email: 'another.admin@example.com',
    displayName: 'Jane Doe',
    role: 'Admin',
    lastSignInTime: new Date('2024-07-28T11:00:00Z').toISOString(),
  },
];


export default async function UsersPage() {
  let users = await db.user.findMany();

  // If the database is empty, seed it with the mock data.
  if (users.length === 0) {
    await db.user.createMany({
      data: mockUsers.map(u => ({
        email: u.email,
        name: u.displayName,
        role: u.role,
        lastSignInTime: u.lastSignInTime ? new Date(u.lastSignInTime) : null,
        photoURL: u.photoURL,
      })),
      skipDuplicates: true, // Avoid errors on subsequent runs if needed
    });
    // Fetch the users again after seeding
    users = await db.user.findMany();
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="User Management" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        {/* Pass the server-fetched users to the client component */}
        <UsersClient initialUsers={users} />
      </main>
    </div>
  );
}
