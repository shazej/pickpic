
import { genkit } from 'genkit';
import { googleAI, gemini15Flash, textEmbedding004 } from '@genkit-ai/google-genai';

// Initialize GenKit with Google AI plugin
export const ai = genkit({
    plugins: [googleAI()],
    model: gemini15Flash, // Default model for text/vision
});

// Helper to get embeddings
export async function getEmbedding(text: string) {
    const result = await ai.embed({
        embedder: textEmbedding004,
        content: text,
    });
    return result;
}

// Helper to analyze image (Multimodal)
export async function analyzeImage(imageBase64: string, prompt: string) {
    const result = await ai.generate({
        model: gemini15Flash,
        prompt: [
            { text: prompt },
            { media: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ],
    });
    return result.text;
}
