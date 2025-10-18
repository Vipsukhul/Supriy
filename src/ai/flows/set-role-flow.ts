
'use server';

/**
 * @fileOverview A Genkit flow for setting custom user claims in Firebase Auth.
 * This is a secure, server-side operation.
 * 
 * - setRole - A function to set a custom 'role' claim for a user.
 * - SetRoleInput - The input type for the setRole function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

const SetRoleInputSchema = z.object({
  userId: z.string().describe('The UID of the user to modify.'),
  role: z.string().describe('The role to assign to the user (e.g., "admin", "Manager").'),
});

export type SetRoleInput = z.infer<typeof SetRoleInputSchema>;

// Initialize the Firebase Admin SDK only if it hasn't been already.
if (!admin.apps.length) {
    // When deployed to Firebase, it will automatically use the project's service account.
    // For local development, you need to set up service account credentials.
    // See: https://firebase.google.com/docs/admin/setup
    admin.initializeApp();
}

/**
 * Sets a custom role claim on a Firebase user. This operation is protected
 * and can only be called from a secure server environment.
 * @param input An object containing the userId and the role to set.
 * @returns A promise that resolves when the claim has been set.
 */
export async function setRole(input: SetRoleInput): Promise<void> {
  return setRoleFlow(input);
}


const setRoleFlow = ai.defineFlow(
  {
    name: 'setRoleFlow',
    inputSchema: SetRoleInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId, role }) => {
    try {
      // Set the custom claim on the user's authentication token.
      await admin.auth().setCustomUserClaims(userId, { role });
      
      console.log(`Successfully set role '${role}' for user ${userId}`);

      // After setting a claim, it's often necessary to force a token refresh on the client.
      // This flow can't do that directly, but the client should be designed to handle this,
      // for example, by asking the user to sign out and sign back in.

    } catch (error) {
      console.error(`Error setting custom claim for user ${userId}:`, error);
      // Re-throw the error so the calling function knows the operation failed.
      throw new Error(`Failed to set custom claim: ${error}`);
    }
  }
);

    