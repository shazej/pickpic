
'use server';

import { ai } from '../genkit';
import { z } from 'genkit';
import { BuyerSearchSchema } from '../../types/schemas';

const BuyerInputSchema = z.object({
    message: z.string(),
    history: z.array(z.any()).optional()
});

export type BuyerChatInput = z.infer<typeof BuyerInputSchema>;

export async function buyerChat(input: BuyerChatInput) {
    return buyerFlow(input);
}

export const buyerFlow = ai.defineFlow(
    {
        name: 'buyerFlow',
        inputSchema: BuyerInputSchema,
        outputSchema: BuyerSearchSchema,
    },
    async ({ message }) => {
        // 1. Extract search params logic (mocked for now, or call Search API)

        const response = await ai.generate({
            prompt: `
        User is searching for: ${message}.
        Generate 3 realistic mock marketplace listings relevant to this search.
        Return them in the 'results' field.
        Each result MUST have a price, condition (New/Like New/Used), and seller contact info (phone or whatsapp).
        
        Also generate a short, friendly response message in 'message'.
        If the user input is in Arabic, respond in Modern Standard Arabic (MSA).
        If the user input is in English, respond in English.
        If unsure, default to Arabic.
      `,
            output: { schema: BuyerSearchSchema },
        });

        return response.output!;
    }
);
