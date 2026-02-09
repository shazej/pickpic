'use server';
/**
 * @fileOverview An AI agent that extracts product details from an image.
 */

import { getAI } from '@/ai/genkit';
import { z } from 'genkit';

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
  // Direct call using getAI() to avoid top-level init
  const promptText = `You are an expert in e-commerce product listings.
From the provided image, identify the product and create a compelling, yet concise, product name and description suitable for an online store.

Analyze the following image:

Photo: {{media url=photoDataUri}}

Respond in JSON format.
`;
  // We manually construct the prompt with media logic if needed, or use generate() simplier
  // Genkit prompts with handle bars are nice, but direct generate is safer here.

  // Extract data from input
  const { photoDataUri } = input;

  const result = await getAI().generate({
    // We accept that we lose the prompt template features but gain build safety
    // Actually we can pass the parts.
    prompt: [
      { text: "You are an expert in e-commerce product listings. Identify the product and create a compelling name and description." },
      { media: { url: photoDataUri } }
    ],
    output: { schema: ExtractProductDetailsOutputSchema }
  });

  return result.output!;
}

