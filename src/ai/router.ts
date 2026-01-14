import { ai } from './genkit';
import { z } from 'genkit';

export const IntentSchema = z.object({
    intent: z.enum(['BUY', 'SELL', 'SUPPORT', 'AMBIGUOUS']),
    reasoning: z.string().describe('Why this intent was chosen'),
    parameters: z.record(z.any()).optional().describe('Extracted entities like product name or price'),
});

export const semanticRouter = ai.defineFlow(
    {
        name: 'semanticRouter',
        inputSchema: z.object({ message: z.string() }),
        outputSchema: IntentSchema,
    },
    async ({ message }) => {
        const prompt = `
      You are a routing agent for a marketplace bot.
      Classify the user's message into one of these intents:
      - BUY: User wants to find, search for, or buy a product. (e.g., "looking for a camera", "red dress", "price of this?")
      - SELL: User wants to list, sell, or upload a product. (e.g., "sell my bike", "I want to list this", "how much can I get for...")
      - SUPPORT: User needs help, contact support, or reporting issues.
      - AMBIGUOUS: Not clear, or greeting.

      User Message: "${message}"
    `;

        const response = await ai.generate({
            prompt: prompt,
            output: { schema: IntentSchema },
        });

        return response.output!;
    }
);
