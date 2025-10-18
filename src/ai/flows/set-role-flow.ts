
'use server';
/**
 * @fileOverview A server-side flow for securely setting a user's role via custom claims.
 *
 * - setRole - A function that sets a custom claim on a user's authentication token.
 * - SetRoleInput - The input type for the setRole function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const SetRoleInputSchema = z.object({
  uid: z.string().describe('The UID of the user to update.'),
  role: z.string().describe('The role to assign to the user.'),
});
export type SetRoleInput = z.infer<typeof SetRoleInputSchema>;

// Initialize Firebase Admin SDK if it hasn't been already.
if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      });
  } else {
      // For local development, it might fall back to GOOGLE_APPLICATION_CREDENTIALS
      initializeApp();
  }
}

export async function setRole(input: SetRoleInput): Promise<{ success: boolean; message?: string }> {
  return setRoleFlow(input);
}

const setRoleFlow = ai.defineFlow(
  {
    name: 'setRoleFlow',
    inputSchema: SetRoleInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string().optional() }),
  },
  async ({ uid, role }) => {
    try {
      // Set the custom claim for the user.
      await getAuth().setCustomUserClaims(uid, { role });

      // After setting a claim, you might want to force a token refresh on the client,
      // but for simplicity, we'll note that the user needs to re-authenticate.
      return {
        success: true,
        message: `Successfully set role to ${role} for user ${uid}. User must sign out and sign back in for changes to take effect.`,
      };
    } catch (error: any) {
      console.error('Error setting custom claim:', error);
      return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
  }
);
