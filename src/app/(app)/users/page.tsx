// src/app/(app)/users/page.tsx

export const dynamic = 'force-dynamic';

import db from '@/lib/prisma';
import { Header } from '@/components/header';
import { UsersClient } from './users-client';
export default async function UsersPage() {
  const users = await db.user.findMany();

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
