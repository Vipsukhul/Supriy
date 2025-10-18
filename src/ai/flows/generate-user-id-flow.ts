
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
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
