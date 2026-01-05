import { aiEngine } from '@/ai/engine/service';
import { ChatRequest } from '@/ai/engine/types';
import { PROMPTS } from './prompts';
import {
    PickPicResponseSchema
} from './schemas';

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
    imageCount: number,
    sellerLocation?: string
}) {
    const prompt = fillPrompt(PROMPTS.BUYER_CHATBOT, {
        TITLE: params.product.title,
        DESCRIPTION: params.product.description || 'No description provided.',
        ATTRIBUTES_JSON: JSON.stringify(params.product.attributes || {}),
        IMAGES_COUNT: params.imageCount,
        MESSAGE: params.message,
        HISTORY: JSON.stringify(params.history),
        SELLER_LOCATION: params.sellerLocation || 'Location not provided'
    });

    try {
        const aiRequest: ChatRequest = {
            messages: [
                { role: 'user', content: prompt }
            ],
            responseFormat: 'json'
        };

        const result = await aiEngine.chat(aiRequest);
        const mandatory = PickPicResponseSchema.parse(result.json || JSON.parse(result.text));

        // Map back to legacy schema
        return {
            reply: mandatory.response_text,
            citations: [], // Legacy citations not easily mapped from new schema
            suggested_questions: mandatory.clarifying_question ? [mandatory.clarifying_question] : [],
            safety_notes: []
        };
    } catch (error) {
        console.error("[AI Engine] Buyer Chat Error:", error);
        throw error;
    }
}

/**
 * Seller Chatbot Flow
 */
export async function runSellerChat(params: {
    draft: any,
    answer: string,
    imageUrl?: string
}) {
    const prompt = fillPrompt(PROMPTS.SELLER_CHATBOT, {
        DRAFT_JSON: JSON.stringify(params.draft),
        ANSWER: params.answer
    });

    try {
        const userContent: any[] = [{ text: prompt }];

        if (params.imageUrl) {
            try {
                // Multimodal generation - supporting data URIs or fetching
                let imageData = params.imageUrl;
                if (!params.imageUrl.startsWith('data:')) {
                    // Use a timeout and handle potential parse errors
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 2000);
                    try {
                        const imageResp = await fetch(params.imageUrl, { signal: controller.signal });
                        if (imageResp.ok) {
                            const imageBuffer = await imageResp.arrayBuffer();
                            imageData = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString("base64")}`;
                            userContent.push({ image_url: imageData });
                        }
                    } catch (err) {
                        console.warn("[AI Engine] Could not fetch image, proceeding without it:", err);
                        // Still include a text reference to the image if possible or just skip
                    } finally {
                        clearTimeout(timeout);
                    }
                } else {
                    userContent.push({ image_url: imageData });
                }
            } catch (e) {
                console.warn("[AI Engine] Image processing error, proceeding with text only:", e);
            }
        }

        const aiRequest: ChatRequest = {
            messages: [
                { role: 'user', content: userContent }
            ],
            responseFormat: 'json'
        };

        const result = await aiEngine.chat(aiRequest);
        const mandatory = PickPicResponseSchema.parse(result.json || JSON.parse(result.text));

        // Map back to legacy schema
        const missing = [];
        if (!mandatory.listing_fields?.category) missing.push('category');
        if (!mandatory.listing_fields?.brand) missing.push('brand');
        if (!mandatory.listing_fields?.condition) missing.push('condition');
        if (!mandatory.listing_fields?.price_suggestion) missing.push('price');

        return {
            updated_fields: {
                title: mandatory.listing_fields?.brand ? `${mandatory.listing_fields.brand} ${mandatory.listing_fields.model || ''}` : undefined,
                description: mandatory.response_text,
                price: mandatory.listing_fields?.price_suggestion,
                category: mandatory.listing_fields?.category,
                condition: mandatory.listing_fields?.condition,
                attributes: mandatory.listing_fields ? { ...mandatory.listing_fields } : undefined
            },
            next_question: mandatory.clarifying_question ? {
                question_key: mandatory.intent === 'clarify' ? 'missing_info' : 'followup',
                question_text: mandatory.clarifying_question,
                suggestions: []
            } : null,
            progress: {
                required_complete: mandatory.intent === 'list' && mandatory.confidence > 0.8,
                missing: missing
            },
            feedback: mandatory.response_text,
            suggestions: []
        };
    } catch (error) {
        console.error("[AI Engine] Seller Chat Error:", error);
        throw error;
    }
}
