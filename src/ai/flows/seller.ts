import { ai } from '../genkit';
import { z } from 'genkit';

export const SellerListingSchema = z.object({
    productName: z.string().describe('Name of the product'),
    price: z.number().optional().describe('Price in local currency'),
    description: z.string().optional().describe('Short description'),
    location: z.string().optional().describe('City or area'),
    category: z.string().optional().describe('Product category'),
    confidence: z.number().describe('Confidence 0-1 that we have enough info to list'),
    missingFields: z.array(z.string()).describe('List of fields still needed to be asked'),
});

export const sellerFlow = ai.defineFlow(
    {
        name: 'sellerFlow',
        inputSchema: z.object({ message: z.string(), history: z.array(z.any()).optional() }),
        outputSchema: SellerListingSchema,
    },
    async ({ message, history }) => {
        const prompt = `
      You are a helpful selling assistant. Your goal is to extract listing details from the user.
      Required fields: Produce Name, Price, Description, Location.
      
      History: ${JSON.stringify(history || [])}
      User Input: "${message}"
      
      Extract what you can. If information is missing, list it in 'missingFields'.
      If confidence is high (>0.8) and all fields are present, we can proceed to confirmation.
    `;

        const response = await ai.generate({
            prompt: prompt,
            output: { schema: SellerListingSchema },
        });

        return response.output!;
    }
);
