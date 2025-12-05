'use server';
/**
 * @fileOverview An AI agent for answering questions about images.
 *
 * - visionChat - A function that handles the conversational image analysis.
 * - VisionChatInput - The input type for the visionChat function.
 * - VisionChatOutput - The return type for the visionChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const VisionChatOutputSchema = z.object({
  response: z.string().describe("The AI's answer to the user's question."),
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
    prompt: `You are an expert visual assistant. Your task is to answer the user's questions based on the provided image and the conversation history.

- Analyze the image provided by the user.
- Read the user's question.
- Provide a clear, concise, and helpful answer.
- If the user's question is unrelated to the image, politely steer the conversation back to the visual context.

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
    const {output} = await prompt(input);
    return output!;
  }
);
