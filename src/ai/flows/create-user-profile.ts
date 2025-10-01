'use server';

/**
 * @fileOverview A trusted flow to create a user profile document in Firestore.
 * This is called after a user successfully signs up.
 *
 * - createUserProfile - A function that creates a user document.
 * - CreateUserProfileInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';

export const CreateUserProfileInputSchema = z.object({
  uid: z.string().describe('The user\'s unique ID from Firebase Auth.'),
  email: z.string().email().describe('The user\'s email address.'),
  name: z.string().describe('The user\'s display name.'),
});
export type CreateUserProfileInput = z.infer<typeof CreateUserProfileInputSchema>;

export async function createUserProfile(
  input: CreateUserProfileInput
): Promise<{ success: boolean }> {
  return createUserProfileFlow(input);
}

const createUserProfileFlow = ai.defineFlow(
  {
    name: 'createUserProfileFlow',
    inputSchema: CreateUserProfileInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input: CreateUserProfileInput) => {
    const userDocRef = doc(db, 'users', input.uid);

    const newUserProfile: AppUser = {
      uid: input.uid,
      email: input.email,
      name: input.name,
      role: 'Project Manager', // Assign a default role
    };

    await setDoc(userDocRef, newUserProfile);

    return { success: true };
  }
);
