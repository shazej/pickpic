'use server';
/**
 * @fileOverview An AI agent for generating images based on an input image and a text prompt.
 *
 * - generateImages - A function that handles the image generation process.
 * - GenerateImagesInput - The input type for the generateImages function.
 * - GenerateImagesOutput - The return type for the generateImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImagesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to base the generation on, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().optional().describe("An optional text prompt to guide the image generation.")
});
export type GenerateImagesInput = z.infer<typeof GenerateImagesInputSchema>;

const GenerateImagesOutputSchema = z.array(z.object({
    url: z.string().describe("The data URI of the generated image.")
}));
export type GenerateImagesOutput = z.infer<typeof GenerateImagesOutputSchema>;

export async function generateImages(input: GenerateImagesInput): Promise<GenerateImagesOutput> {
  return generateImagesFlow(input);
}

const generationPrompt = `Generate a new image that is visually similar to the input image.
{{#if prompt}}
Additionally, consider the following instruction: {{{prompt}}}
{{/if}}`;

const generateSingleImage = async (input: GenerateImagesInput): Promise<{url: string}> => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            {media: {url: input.photoDataUri}},
            {text: generationPrompt},
        ],
        config: {
            responseModalities: ['IMAGE'],
        },
    });
    if (!media.url) {
        throw new Error('Image generation failed to return a URL.');
    }
    return { url: media.url };
}

const generateImagesFlow = ai.defineFlow(
  {
    name: 'generateImagesFlow',
    inputSchema: GenerateImagesInputSchema,
    outputSchema: GenerateImagesOutputSchema,
  },
  async (input) => {
    // Gemini Flash Image Preview generates one image at a time.
    // We will call it multiple times in parallel to get 5 images.
    const generationPromises = Array(5).fill(null).map(() => generateSingleImage(input));
    
    const results = await Promise.all(generationPromises);

    return results;
  }
);
