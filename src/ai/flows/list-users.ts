
'use server';
/**
 * @fileOverview A flow to list all users in Firebase Authentication.
 *
 * - listAllUsers - A function that returns a list of all users.
 * - AppUser - The type for a simplified user object.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';
import type { AppUser } from '@/lib/types';


const AppUserSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  disabled: z.boolean(),
  emailVerified: z.boolean(),
  role: z.string().optional(),
  lastSignInTime: z.string().optional(),
});


const ListUsersOutputSchema = z.object({
  users: z.array(AppUserSchema),
});

export async function listAllUsers(): Promise<AppUser[]> {
    const result = await listUsersFlow();
    return result.users;
}

const listUsersFlow = ai.defineFlow(
  {
    name: 'listUsersFlow',
    outputSchema: ListUsersOutputSchema,
  },
  async () => {
    const listUsersResult = await admin.auth().listUsers();

    // Fetch custom claims (roles) for all users in parallel
    const usersWithRoles = await Promise.all(
        listUsersResult.users.map(async (user) => {
            const { customClaims } = await admin.auth().getUser(user.uid);
            return {
                ...user,
                role: customClaims?.role || 'Project Manager',
            };
        })
    );

    const users = usersWithRoles.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      role: user.role as AppUser['role'],
      lastSignInTime: user.metadata.lastSignInTime,
    }));

    return { users };
  }
);
