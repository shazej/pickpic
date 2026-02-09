import { ai } from '../genkit';
import { z } from 'zod';

// Output schema for search intent
const SearchIntentSchema = z.object({
    query_text: z.string().describe('The primary text search query derived from the input'),
    filters: z.object({
        category: z.string().optional(),
        min_price: z.number().optional(),
        max_price: z.number().optional(),
        tags: z.array(z.string()).optional(),
    }).optional(),
    transcript: z.string().optional().describe('The raw transcript if audio was provided'),
});

export const transcribeAndSearch = ai.defineFlow(
    {
        name: 'transcribeAndSearch',
        inputSchema: z.object({
            audio_data: z.string().describe('Base64 encoded audio data or Data URI'),
        }),
        outputSchema: SearchIntentSchema,
    },
    async ({ audio_data }) => {
        // Construct a multimodal prompt for Gemini
        // assuming ai.generate supports 'media' or we pass it in the prompt part if supported by the plugin abstraction
        // For now, using the standard Genkit multimodal format if available, or just prompt instructions.
        // Note: The googleAI plugin supports Part objects. 
        // We'll attempt to pass a prompt that includes the media.

        const prompt = `
      You are a helpful search assistant.
      The user is speaking a search query for an e-commerce marketplace.
      
      Task:
      1. Transcribe the audio exactly.
      2. Extract the search intent (what product are they looking for?).
      3. Extract any filters (price range, category, color, etc.).
      
      Return a JSON object with query_text and filters.
    `;

        const { output } = await ai.generate({
            prompt: [
                { text: prompt },
                { media: { url: audio_data } } // Genkit convention for media
            ],
            output: { schema: SearchIntentSchema },
        });

        if (output == null) {
            throw new Error('Failed to process audio search');
        }

        return output;
    }
);

const VisualDescriptorSchema = z.object({
    description: z.string().describe('Visual description of the product in the video'),
    keywords: z.array(z.string()).describe('Search keywords derived from the visual content'),
    visual_attributes: z.object({
        color: z.string().optional(),
        pattern: z.string().optional(),
        material: z.string().optional(),
        style: z.string().optional(),
    }),
});

export const analyzeVideoAndSearch = ai.defineFlow(
    {
        name: 'analyzeVideoAndSearch',
        inputSchema: z.object({
            video_data: z.string().describe('Base64 encoded video/image data or Data URI'),
        }),
        outputSchema: VisualDescriptorSchema,
    },
    async ({ video_data }) => {
        const prompt = `
      You are a visual search assistant.
      The user showed a product in this video/image.
      
      Task:
      1. Describe the main product visible.
      2. Generate search keywords to find similar items.
      3. Extract visual attributes (color, pattern, material).
    `;

        const { output } = await ai.generate({
            prompt: [
                { text: prompt },
                { media: { url: video_data } }
            ],
            output: { schema: VisualDescriptorSchema },
        });

        if (output == null) {
            throw new Error('Failed to analyze video');
        }

        return output;
    }
);
