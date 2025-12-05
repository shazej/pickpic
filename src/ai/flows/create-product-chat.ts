'use server';
/**
 * @fileOverview An AI agent for creating product listings through conversation.
 *
 * - createProductChat - A function that handles the conversational product creation process.
 * - CreateProductChatInput - The input type for the createProductChat function.
 * - CreateProductChatOutput - The return type for the createProductChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateProductChatInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({text: z.string().optional(), media: z.object({url: z.string()}).optional()})),
      })
    )
    .describe('The chat history between the user and the AI.'),
});
export type CreateProductChatInput = z.infer<typeof CreateProductChatInputSchema>;

const CreateProductChatOutputSchema = z.object({
  productName: z.string().optional().describe('The concise name of the identified product.'),
  description: z.string().optional().describe('A compelling, short paragraph describing the product for a potential customer.'),
  price: z.number().optional().describe('A suggested price for the product based on the image and description.'),
  response: z.string().describe("The AI's next response in the conversation."),
});
export type CreateProductChatOutput = z.infer<typeof CreateProductChatOutputSchema>;


export async function createProductChat(input: CreateProductChatInput): Promise<CreateProductChatOutput> {
  return createProductChatFlow(input);
}

const prompt = ai.definePrompt(
  {
    name: 'createProductChatPrompt',
    input: {schema: CreateProductChatInputSchema},
    output: {schema: CreateProductChatOutputSchema},
    prompt: `You are an expert AI assistant helping a seller create a product listing for their e-commerce store. Your goal is to gather the product name, a description, and a price.

Engage in a friendly, natural conversation.

- If the user uploads an image, analyze it to determine the product name and description. Suggest a price.
- If the user provides text, use it to understand the product.
- Ask clarifying questions ONLY if necessary. For example, if an image is unclear or a description is vague.
- Once you are confident you have a good name, description, and price, present them.
- Your 'response' field should be your conversational reply to the user.
- Fill in the 'productName', 'description', and 'price' fields in the output JSON when you have determined them. You can fill them all at once or one by one as you determine them.
- Keep your text responses concise.

Analyze the chat history and provide the next step.
`,
  }
);


const createProductChatFlow = ai.defineFlow(
  {
    name: 'createProductChatFlow',
    inputSchema: CreateProductChatInputSchema,
    outputSchema: CreateProductChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
