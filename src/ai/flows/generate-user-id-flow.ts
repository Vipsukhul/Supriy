
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

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

const db = getFirestore(adminApp);

const GenerateUserIdInputSchema = z.object({
  prefix: z.string().describe('The prefix for the user ID.'),
});

const GenerateUserIdOutputSchema = z.object({
  userId: z.string(),
});

export type GenerateUserIdInput = z.infer<typeof GenerateUserIdInputSchema>;
export type GenerateUserIdOutput = z.infer<typeof GenerateUserIdOutputSchema>;

export async function generateUserId(
  input: GenerateUserIdInput
): Promise<GenerateUserIdOutput> {
  return generateUserIdFlow(input);
}

const generateUserIdFlow = ai.defineFlow(
  {
    name: 'generateUserIdFlow',
    inputSchema: GenerateUserIdInputSchema,
    outputSchema: GenerateUserIdOutputSchema,
  },
  async ({ prefix }) => {
    const counterRef = db.collection('counters').doc('users');

    let newId = 1;
    await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (counterDoc.exists) {
            newId = counterDoc.data()?.lastId + 1;
            transaction.update(counterRef, { lastId: newId });
        } else {
            transaction.set(counterRef, { lastId: newId });
        }
    });

    const formattedId = `${prefix}${String(newId).padStart(6, '0')}`;

    return {
      userId: formattedId,
    };
  }
);
