import { ai } from './genkit';
import { z } from 'genkit';
import { IntentSchema } from '../types/schemas';

export { IntentSchema };

export const semanticRouter = ai.defineFlow(
    {
        name: 'semanticRouter',
        inputSchema: z.object({ message: z.string() }),
        outputSchema: IntentSchema,
    },
    async ({ message }) => {
        const prompt = `
      You are a routing agent for a marketplace bot in the Middle East.
      Classify the user's message (which may be in Arabic or English) into one of these intents:
      - BUY: User wants to find, search for, or buy a product. (e.g., "looking for a camera", "red dress", "price of this?", "شراء", "أريد شراء", "ابحث عن", "بكم", "فستان أحمر")
      - SELL: User wants to list, sell, or upload a product. (e.g., "sell my bike", "I want to list this", "how much can I get for...", "بيع", "أريد بيع", "عندي للبيع", "إدراج منتج")
      - SUPPORT: User needs help, contact support, or reporting issues.
      - AMBIGUOUS: Not clear, single words like "apple" / "تفاح" (could be brand or fruit/buying or selling), or general greetings in any language.

      Return a confidence score (0.0 - 1.0).
      If the user just says a noun (e.g. "iPhone", "Apple", "سيارة", "تفاح") without a clear BUY/SELL verb, the intent is AMBIGUOUS and confidence should be LOW (e.g. 0.5), or intent should be AMBIGUOUS directly.
      Unless checking price/availability is usually implied by context, prefer AMBIGUOUS for single nouns to allow clarification.

      User Message: "${message}"
    `;

        const response = await ai.generate({
            prompt: prompt,
            output: { schema: IntentSchema },
        });

        return response.output!;
    }
);
