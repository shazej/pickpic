
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
    location: z.string().optional(),
    contact_info: z.string().optional(),
});

// Schema for the Question Output
const QuestionOutputSchema = z.object({
    question_text: z.string(),
    question_key: z.string(),
    answer_type: z.enum(['text', 'number', 'select', 'currency']),
    suggestions: z.array(z.string()).optional(),
});

// Helper for JSON parsing from AI response
function parseAIJson(text: string) {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse AI JSON", text);
        return null;
    }
}

export const generateListingQuestion = {
    run: async ({ state, image_url }: { state: any, image_url?: string }) => {
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const apiKey = process.env.GOOGLE_GENAI_API_KEY;

            if (!apiKey) throw new Error("Missing GOOGLE_GENAI_API_KEY");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
            - Location (City)
            - Preferred Contact Info (Phone/Email or "Chat")
            - Attributes based on category (Brand, Color, Material, Size for apparel, etc.)
            
            Task:
            - Analyze the image (if present) to infer unknown details.
            - Identify the most important missing field.
            - Generate a friendly, short question to ask the seller for this field.
            - Provide helpful suggestions based on the image or common values.
            
            RETURN JSON ONLY. Format:
            {
                "question_text": "string (the question)",
                "question_key": "string (the field key, e.g. title, category)",
                "answer_type": "text | number | select | currency",
                "suggestions": ["suggestion1", "suggestion2"]
            }
            `;

            const result = await model.generateContent([prompt]); // Image handling skipped for simplicity here, can add if URL is base64 or supported
            const json = parseAIJson(result.response.text());

            if (!json) throw new Error("Failed to parse AI response");

            return QuestionOutputSchema.parse(json);

        } catch (e) {
            console.error("Generate Question Error", e);
            // Fallback
            return {
                question_text: "What is the title of your product?",
                question_key: "title",
                answer_type: "text" as const,
                suggestions: []
            };
        }
    }
};

// Schema for Answer Processing Output
const AnswerProcessingOutputSchema = z.object({
    updated_state: ListingStateSchema,
    message_to_user: z.string().optional(),
    is_complete: z.boolean(),
});

export const processListingAnswer = {
    run: async ({ state, question_key, user_answer }: { state: any, question_key: string, user_answer: string }) => {
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const apiKey = process.env.GOOGLE_GENAI_API_KEY;

            if (!apiKey) throw new Error("Missing GOOGLE_GENAI_API_KEY");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
            
            RETURN JSON ONLY. Format:
            {
                "updated_state": { ...full updated state object... },
                "message_to_user": "Optional confirmation message",
                "is_complete": boolean
            }
            `;

            const result = await model.generateContent(prompt);
            const json = parseAIJson(result.response.text());

            if (!json) throw new Error("Failed to parse AI response");

            return AnswerProcessingOutputSchema.parse(json);

        } catch (e) {
            console.error("Process Answer Error", e);
            // Return state as is + complete false to prevent blocking
            return {
                updated_state: state,
                message_to_user: "I didn't quite catch that, but let's continue.",
                is_complete: false
            };
        }
    }
};
