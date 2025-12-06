
'use server';
/**
 * @fileOverview An AI agent that finds similar products based on an image.
 *
 * - findSimilarProducts - A function that takes an image and returns a list of similar products.
 * - FindSimilarProductsInput - The input type for the findSimilarProducts function.
 * - FindSimilarProductsOutput - The return type for the findSimilarProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { products as allProducts, Product } from '@/lib/data';

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
    products: z.array(ProductSchema).describe('An array of products that are visually similar to the one in the image.')
});
export type FindSimilarProductsOutput = z.infer<typeof FindSimilarProductsOutputSchema>;

export async function findSimilarProducts(input: FindSimilarProductsInput): Promise<FindSimilarProductsOutput> {
  return findSimilarProductsFlow(input);
}

// Create a tool for the AI to get available products
const getAvailableProducts = ai.defineTool(
    {
        name: 'getAvailableProducts',
        description: 'Get a list of all available products in the catalog.',
        inputSchema: z.object({
            query: z.string().optional().describe('An optional search query to filter products.'),
        }),
        outputSchema: z.array(ProductSchema),
    },
    async () => {
        return allProducts;
    }
);


const prompt = ai.definePrompt({
  name: 'findSimilarProductsPrompt',
  input: {schema: FindSimilarProductsInputSchema},
  output: {schema: FindSimilarProductsOutputSchema},
  tools: [getAvailableProducts],
  prompt: `You are an expert e-commerce assistant. Your task is to find products from the catalog that are visually similar to the product in the user-provided image.

1.  Call the \`getAvailableProducts\` tool to get the list of all products in the catalog.
2.  Analyze the user's image: {{media url=photoDataUri}}
3.  From the full list of available products, select up to 6 products that are the best visual match to the item in the image.
4.  Return the selected products in the 'products' array. If no strong matches are found, return an empty array.
`,
});

const findSimilarProductsFlow = ai.defineFlow(
  {
    name: 'findSimilarProductsFlow',
    inputSchema: FindSimilarProductsInputSchema,
    outputSchema: FindSimilarProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
