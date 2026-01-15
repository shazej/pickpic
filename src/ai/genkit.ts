import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with Google AI plugin
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-flash-latest', // Matching working script model
});

// Helper for legacy code if needed
export const getAI = () => ai;
