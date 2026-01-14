import { ai } from '../genkit';
import { z } from 'genkit';

export const ProductResultSchema = z.object({
    id: z.string(),
    title: z.string(),
    price: z.number(),
    location: z.string(),
    imageUrl: z.string().optional(),
});

export const BuyerSearchSchema = z.object({
    query: z.string().describe('Search query extracted from user'),
    locationFilter: z.string().optional(),
    results: z.array(ProductResultSchema).optional().describe('Found products'),
    message: z.string().describe('Response message to user'),
});

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
        Also generate a friendly response message in 'message'.
      `,
            output: { schema: BuyerSearchSchema },
        });

        return response.output!;
    }
);
