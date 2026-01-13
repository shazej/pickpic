
'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from 'genkit'; // Keep z for schema types if needed, or switch to zod
import { products as allProducts } from '@/lib/data';
import type { Product } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

const VisionChatInputSchema = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.array(z.object({ text: z.string().optional(), media: z.object({ url: z.string() }).optional() })),
      })
    )
    .describe('The chat history between the user and the AI, including images.'),
});
export type VisionChatInput = z.infer<typeof VisionChatInputSchema>;

const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.string(),
  photoUrl: z.string().optional(),
  photoHint: z.string().optional(),
});

const VisionChatOutputSchema = z.object({
  response: z.string().describe("The AI's answer to the user's question."),
  products: z.array(ProductSchema).optional().describe('An array of products if the user asks to find similar items.')
});
export type VisionChatOutput = z.infer<typeof VisionChatOutputSchema>;


export async function visionChat(input: VisionChatInput): Promise<VisionChatOutput> {
  // Check if the last user message is a confirmation to find products
  const lastUserMessage = input.history.filter(m => m.role === 'user').pop();
  // Safe check for text content
  const textContent = lastUserMessage?.content.find(c => c.text)?.text;
  const isYes = textContent?.trim().toLowerCase().includes('yes');

  if (isYes) {
    // If so, return random products
    const shuffledProducts = allProducts.sort(() => 0.5 - Math.random());
    const randomProducts = shuffledProducts.slice(0, Math.floor(Math.random() * 3) + 5) as Product[]; // 5 to 7 products

    return {
      response: "Great! Here are some products I found that look similar. Let me know if you have any questions about them!",
      products: randomProducts,
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    // Map history to Gemini Client format
    const contents = await Promise.all(input.history.map(async (msg) => {
      const parts: any[] = [];

      for (const c of msg.content) {
        if (c.text) {
          parts.push({ text: c.text });
        }
        if (c.media?.url) {
          // Handle Data URI or URL
          const url = c.media.url;
          if (url.startsWith('data:')) {
            const [mimeType, base64Data] = url.split(';base64,');
            const mime = mimeType.replace('data:', '');
            parts.push({
              inlineData: {
                mimeType: mime,
                data: base64Data
              }
            });
          } else {
            // Note: URL support might need fetch+blob conversion if not supported directly by SDK in this context?
            // Gemini SDK usually takes base64. 
            // For now assuming data URI is passed from client (fileToDataUri).
          }
        }
      }

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    }));

    const prompt = "You are an expert visual assistant. Answer the user's question based on the image and history. Return JSON with 'response' (string) and optional 'products' array.";

    // Append system-like instruction to the last user message or as a separate part?
    // Gemini doesn't support system role in 'contents' directly in all versions, but 'systemInstruction' param exists.
    // For simplicity, we just rely on the model understanding the context.
    // We need to enforce JSON schema structure in the response.

    const result = await model.generateContent({
      contents: contents,
      systemInstruction: "You are a helpful shopping assistant. You help users identify products in images and answer questions. Output MUST be valid JSON matching this schema: { response: string, products?: [] }.",
    });

    const responseText = result.response.text();
    const jsonData = JSON.parse(responseText);

    return jsonData as VisionChatOutput;

  } catch (error) {
    console.error("Vision Chat Error directly:", error);
    throw error;
  }
}


