import { ai } from '../genkit';
import { z } from 'zod';

// Schema for the Listing State
const ListingStateSchema = z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    condition: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().optional(),
    description: z.string().optional(),
    attributes: z.record(z.string(), z.any()).optional(),
    images: z.array(z.string()).optional(),
});

// Schema for the Question Output
const QuestionOutputSchema = z.object({
    question_text: z.string().describe('The natural language question to ask the seller'),
    question_key: z.string().describe('The internal key of the field being asked about (e.g., "title", "category")'),
    answer_type: z.enum(['text', 'number', 'select', 'currency']).describe('The expected input type'),
    suggestions: z.array(z.string()).optional().describe('Suggested answers/chips for the seller'),
});

export const generateListingQuestion = ai.defineFlow(
    {
        name: 'generateListingQuestion',
        inputSchema: z.object({
            state: ListingStateSchema,
            image_url: z.string().optional(),
        }),
        outputSchema: QuestionOutputSchema,
    },
    async ({ state, image_url }) => {
        // Prompt Gemini to analyze state and decide next question
        const prompt = `
      You are an expert e-commerce listing assistant.
      Your goal is to help a seller create a perfect product listing by asking ONE question at a time.
      
      Current Listing State: ${JSON.stringify(state)}
      ${image_url ? `Product Image URL: ${image_url}` : '(No image provided)'}
      
      Requirements for a complete listing:
      - Title
      - Category
      - Condition (New, Used, Refurbished)
      - Price (can be 0/null for contact seller)
      - Attributes based on category (Brand, Color, Material, Size for apparel, etc.)
      
      Task:
      - Analyze the image (if present) to infer unknown details.
      - Identify the most important missing field.
      - Generate a friendly, short question to ask the seller for this field.
      - Provide helpful suggestions based on the image or common values.
    `;

        // Call Gemini
        const { output } = await ai.generate({
            prompt: prompt,
            output: { schema: QuestionOutputSchema },
        });

        if (output == null) {
            throw new Error('Failed to generate question');
        }

        return output;
    }
);

// Schema for Answer Processing Output
const AnswerProcessingOutputSchema = z.object({
    updated_state: ListingStateSchema,
    message_to_user: z.string().optional().describe('Confirmation or follow-up comment'),
    is_complete: z.boolean().describe('True if the listing has all required fields'),
});

export const processListingAnswer = ai.defineFlow(
    {
        name: 'processListingAnswer',
        inputSchema: z.object({
            state: ListingStateSchema,
            question_key: z.string(),
            user_answer: z.string(),
        }),
        outputSchema: AnswerProcessingOutputSchema,
    },
    async ({ state, question_key, user_answer }) => {
        const prompt = `
      You are an expert data extracting assistant.
      
      Current State: ${JSON.stringify(state)}
      Question Asked (Key): ${question_key}
      User Answer: "${user_answer}"
      
      Task:
      - Extract the relevant information from the user's answer for the field '${question_key}'.
      - Update the state with this new information.
      - Normalize values (e.g., capitalize Title, format Price).
      - If the user provides extra info (e.g., "It's a red Nike shirt"), update other fields too (Brand: Nike, Color: Red).
      - Check if the listing is now "minimally complete" (Title, Category, Price, Condition present).
    `;

        const { output } = await ai.generate({
            prompt: prompt,
            output: { schema: AnswerProcessingOutputSchema },
        });

        if (output == null) {
            throw new Error('Failed to process answer');
        }

        return output;
    }
);
