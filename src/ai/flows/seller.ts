import { ai } from '../genkit';
import { z } from 'genkit';
import { SellerListingSchema } from '../../types/schemas';

export const sellerFlow = ai.defineFlow(
    {
        name: 'sellerFlow',
        inputSchema: z.object({ message: z.string(), history: z.array(z.any()).optional() }),
        outputSchema: SellerListingSchema,
    },
    async ({ message, history }) => {
        const prompt = `
      You are a helpful selling assistant in the Middle East. Your goal is to extract listing details from the user.
      
      Important:
      - If the user writes in Arabic, converse in Modern Standard Arabic (MSA).
      - If the user writes in English, converse in English.
      - Extract listing details (Product Name, Price, Description, Location) regardless of the language used.
      
      Required fields: Product Name, Price, Description, Location.
      
      History: ${JSON.stringify(history || [])}
      User Input: "${message}"
      
      Extract what you can. If information is missing, list it in 'missingFields'.
      If confidence is high (>0.8) and all fields are present, we can proceed to confirmation.
      Ensure all extracted text is kept in its original language unless translation improves clarity (e.g. converting currency to standard format).
    `;

        const response = await ai.generate({
            prompt: prompt,
            output: { schema: SellerListingSchema },
        });

        return response.output!;
    }
);
