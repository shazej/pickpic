
'use server';
/**
 * @fileOverview An AI agent that finds similar products based on an image.
 *
 * - findSimilarProducts - A function that takes an image and returns a list of similar products.
 * - FindSimilarProductsInput - The input type for the findSimilarProducts function.
 * - FindSimilarProductsOutput - The return type for the findSimilarProducts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { products as allProducts } from '@/lib/data';


const FindSimilarProductsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FindSimilarProductsInput = z.infer<typeof FindSimilarProductsInputSchema>;

// Define the schema for a single product to be returned.
// We use the existing Product type from the application, but redefine it for Zod validation.
const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.string(),
  photoUrl: z.string().optional(),
  photoHint: z.string().optional(),
  description: z.string().optional(),
  details: z.object({
    condition: z.string().optional(),
    category: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    material: z.string().optional(),
    features: z.string().optional(),
  }).optional(),
});

const FindSimilarProductsOutputSchema = z.object({
  products: z.array(ProductSchema).describe('An array of 6 products that are visually similar to the one in the image.')
});
export type FindSimilarProductsOutput = z.infer<typeof FindSimilarProductsOutputSchema>;

export async function findSimilarProducts(input: FindSimilarProductsInput): Promise<FindSimilarProductsOutput> {
  return findSimilarProductsFlow(input);
}

const findSimilarProductsFlow = ai.defineFlow(
  {
    name: 'findSimilarProductsFlow',
    inputSchema: FindSimilarProductsInputSchema,
    outputSchema: FindSimilarProductsOutputSchema,
  },
  async () => {
    // Shuffle the array and take the first 6 products for a random selection.
    const shuffledProducts = allProducts.sort(() => 0.5 - Math.random());
    const randomProducts = shuffledProducts.slice(0, 6);

    return { products: randomProducts };
  }
);
