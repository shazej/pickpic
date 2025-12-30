
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROMPTS } from './prompts';
import {
    BuyerChatResponseSchema,
    SellerChatResponseSchema
} from './schemas';

function getModel() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
    return genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: { responseMimeType: "application/json" }
    });
}

// --- Helper for Prompt Injection ---
function fillPrompt(template: string, vars: Record<string, any>): string {
    let output = template;
    for (const [key, value] of Object.entries(vars)) {
        output = output.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return output;
}

/**
 * Buyer Chatbot Flow
 */
export async function runBuyerChat(params: {
    product: any,
    message: string,
    history: any[],
    imageCount: number
}) {
    const prompt = fillPrompt(PROMPTS.BUYER_CHATBOT, {
        TITLE: params.product.title,
        DESCRIPTION: params.product.description || 'No description provided.',
        ATTRIBUTES_JSON: JSON.stringify(params.product.attributes || {}),
        IMAGES_COUNT: params.imageCount,
        MESSAGE: params.message,
        HISTORY: JSON.stringify(params.history)
    });

    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return BuyerChatResponseSchema.parse(JSON.parse(text));
    } catch (error) {
        console.error("[AI SDK] Buyer Chat Error:", error);
        throw error;
    }
}

/**
 * Seller Chatbot Flow
 */
export async function runSellerChat(params: {
    draft: any,
    answer: string
}) {
    const prompt = fillPrompt(PROMPTS.SELLER_CHATBOT, {
        DRAFT_JSON: JSON.stringify(params.draft),
        ANSWER: params.answer
    });

    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return SellerChatResponseSchema.parse(JSON.parse(text));
    } catch (error) {
        console.error("[AI SDK] Seller Chat Error:", error);
        throw error;
    }
}
