import { ai } from '../genkit';
import { z } from 'genkit';
import { BuyerSearchSchema } from '../../types/schemas';

export const buyerFlow = ai.defineFlow(
    {
        name: 'buyerFlow',
        inputSchema: z.object({ message: z.string() }),
        outputSchema: BuyerSearchSchema,
    },
    async ({ message }) => {
        // 1. Extract search params
        const extractionPrompt = `
      Extract search query and location from: "${message}".
      Example: "Red dress in New York" -> query="Red dress", location="New York".
    `;

        // In a real app, we would use a Tool here to search the database.
        // For MVP validation/Generative UI demo, we will mock results if the intent is clear.

        const response = await ai.generate({
            prompt: `
        User is searching for: ${message}.
        Generate 3 realistic mock marketplace listings relevant to this search.
        Return them in the 'results' field.
        
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
