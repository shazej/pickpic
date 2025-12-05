'use server';
/**
 * @fileOverview An AI agent that extracts product details from an image.
 *
 * - extractProductDetails - A function that handles the product detail extraction process.
 * - ExtractProductDetailsInput - The input type for the extractProductDetails function.
 * - ExtractProductDetailsOutput - The return type for the extractProductDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractProductDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractProductDetailsInput = z.infer<typeof ExtractProductDetailsInputSchema>;

const ExtractProductDetailsOutputSchema = z.object({
  productName: z.string().describe('The concise name of the identified product.'),
  description: z.string().describe('A compelling, short paragraph describing the product for a potential customer.'),
});
export type ExtractProductDetailsOutput = z.infer<typeof ExtractProductDetailsOutputSchema>;

export async function extractProductDetails(input: ExtractProductDetailsInput): Promise<ExtractProductDetailsOutput> {
  return extractProductDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractProductDetailsPrompt',
  input: {schema: ExtractProductDetailsInputSchema},
  output: {schema: ExtractProductDetailsOutputSchema},
  prompt: `You are an expert in e-commerce product listings.
From the provided image, identify the product and create a compelling, yet concise, product name and description suitable for an online store.

Analyze the following image:

Photo: {{media url=photoDataUri}}

Respond in JSON format.
`,
});

const extractProductDetailsFlow = ai.defineFlow(
  {
    name: 'extractProductDetailsFlow',
    inputSchema: ExtractProductDetailsInputSchema,
    outputSchema: ExtractProductDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
