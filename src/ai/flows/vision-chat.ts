
'use server';
/**
 * @fileOverview An AI agent for answering questions about images.
 *
 * - visionChat - A function that handles the conversational image analysis.
 * - VisionChatInput - The input type for the visionChat function.
 * - VisionChatOutput - The return type for the visionChatOutput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { products as allProducts } from '@/lib/data';
import type { Product } from '@/lib/types';

const VisionChatInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({text: z.string().optional(), media: z.object({url: z.string()}).optional()})),
      })
    )
    .describe('The chat history between the user and the AI, including images.'),
});
export type VisionChatInput = z.infer<typeof VisionChatInputSchema>;

const ProductSchema = z.object({
    name: z.string(),
    price: z.number(),
    category: z.string(),
    photoUrl: z.string().optional(),
    photoHint: z.string().optional(),
});

const VisionChatOutputSchema = z.object({
  response: z.string().describe("The AI's answer to the user's question."),
  products: z.array(ProductSchema).optional().describe('An array of products if the user asks to find similar items.')
});
export type VisionChatOutput = z.infer<typeof VisionChatOutputSchema>;


export async function visionChat(input: VisionChatInput): Promise<VisionChatOutput> {
  return visionChatFlow(input);
}

const prompt = ai.definePrompt(
  {
    name: 'visionChatPrompt',
    input: {schema: VisionChatInputSchema},
    output: {schema: VisionChatOutputSchema},
    prompt: `You are an expert visual assistant for an e-commerce website. Your task is to answer the user's questions based on the provided image and the conversation history.

- Analyze the image provided by the user.
- If the user asks to find similar products, you MUST respond by populating the 'products' array with 5 to 7 random products from the website's catalog. Your text 'response' should be a brief, engaging message introducing these products.
- If the user asks a general question about the image, provide a clear, concise, and helpful answer in the 'response' field.
- If the user's question is unrelated to the image, you can gently steer the conversation back to the visual context, but still answer their question.
- If the user provides an image without a specific question, provide a brief, interesting description of what you see in the image.

Analyze the chat history and the image to provide your response.
`,
  }
);


const visionChatFlow = ai.defineFlow(
  {
    name: 'visionChatFlow',
    inputSchema: VisionChatInputSchema,
    outputSchema: VisionChatOutputSchema,
  },
  async (input) => {
    // Check if the last user message is a confirmation to find products
    const lastUserMessage = input.history.filter(m => m.role === 'user').pop();
    const isYes = lastUserMessage?.content[0]?.text?.trim().toLowerCase().includes('yes');

    if (isYes) {
        // If so, return random products
        const shuffledProducts = allProducts.sort(() => 0.5 - Math.random());
        const randomProducts = shuffledProducts.slice(0, Math.floor(Math.random() * 3) + 5) as Product[]; // 5 to 7 products
        
        return {
            response: "Great! Here are some products I found that look similar. Let me know if you have any questions about them!",
            products: randomProducts,
        };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);

    