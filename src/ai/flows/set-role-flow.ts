
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import type { Role } from '@/models/user.model';
import { doc, getFirestore, updateDoc } from 'firebase-admin/firestore';

let adminApp: App;
if (!getApps().length) {
  if (process.env.NODE_ENV === 'production') {
    // For Vercel deployment, use environment variables
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    // For local development, rely on gcloud ADC
    adminApp = initializeApp();
  }
} else {
  adminApp = getApps()[0];
}

const auth = getAuth(adminApp);
const db = getFirestore(adminApp);

const SetRoleInputSchema = z.object({
  userId: z.string().describe('The UID of the user to update.'),
  role: z
    .string()
    .describe(
      'The new role to assign. Must be one of: admin, Country Manager, Manager, Engineer, Guest.'
    ),
});

export type SetRoleInput = z.infer<typeof SetRoleInputSchema>;

export async function setRole(input: SetRoleInput): Promise<void> {
  return setRoleFlow(input);
}

const setRoleFlow = ai.defineFlow(
  {
    name: 'setRoleFlow',
    inputSchema: SetRoleInputSchema,
    // No output needed for this flow
  },
  async ({ userId, role }) => {
    // 1. Set the custom claim on the user's auth token
    await auth.setCustomUserClaims(userId, { role });

    // 2. Update the role in the user's Firestore document for consistency
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({ role: role });
  }
);
