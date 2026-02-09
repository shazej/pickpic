
import { AIProvider, ChatRequest, AIResponse } from "./types";

export class OllamaProvider implements AIProvider {
    private baseUrl: string;
    private modelName: string;

    constructor(baseUrl: string = "http://localhost:11434", modelName: string = "llama3") {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.modelName = modelName;
    }

    async chat(request: ChatRequest): Promise<AIResponse> {
        const url = `${this.baseUrl}/api/chat`;

        const messages = request.messages.map(m => {
            if (typeof m.content === 'string') {
                return { role: m.role === 'model' ? 'assistant' : m.role, content: m.content };
            } else {
                // Ollama multimodal format: images is a separate array of base64 strings
                const text = m.content.map(c => c.text || '').join('\n');
                const images = m.content
                    .filter(c => c.image_url?.startsWith('data:'))
                    .map(c => c.image_url!.split(';base64,')[1]);

                return {
                    role: m.role === 'model' ? 'assistant' : m.role,
                    content: text,
                    images: images.length > 0 ? images : undefined
                };
            }
        });

        const body = {
            model: request.model || this.modelName,
            messages: messages,
            stream: false,
            options: {
                temperature: request.temperature,
                num_predict: request.maxTokens
            },
            format: request.responseFormat === 'json' ? 'json' : undefined
        };

        const hasImages = messages.some(m => m.images && m.images.length > 0);

        // Simple heuristic: if images are present and model doesn't contain 'vision' or 'llava', etc. 
        // Or we just follow the mandate: "if vision not supported... automatically fallback"
        // For now, let's assume we check the model name or just catch it if it fails.
        // The user request says "if vision not supported by the selected model, automatically fallback".

        const isVisionModel = this.modelName.includes('vision') || this.modelName.includes('llava') || this.modelName.includes('moondream');

        if (hasImages && !isVisionModel) {
            return {
                text: JSON.stringify({
                    intent: "clarify",
                    confidence: 0.5,
                    clarifying_question: "What is the product and its condition?",
                    response_text: "I received the image. Please add a short description (brand, type, condition).",
                    listing_fields: null,
                    matched_products: []
                }),
                json: {
                    intent: "clarify",
                    confidence: 0.5,
                    clarifying_question: "What is the product and its condition?",
                    response_text: "I received the image. Please add a short description (brand, type, condition).",
                    listing_fields: null,
                    matched_products: []
                }
            };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Ollama Error: ${error}`);
        }

        const data = await res.json();
        const text = data.message.content;

        return {
            text,
            json: request.responseFormat === 'json' ? JSON.parse(text) : undefined,
            usage: {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count || 0,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
            },
            raw: data
        };
    }

    async healthCheck(): Promise<{ ok: boolean; details?: any }> {
        try {
            const res = await fetch(`${this.baseUrl}/api/tags`);
            return { ok: res.ok };
        } catch (e: any) {
            return { ok: false, details: e.message };
        }
    }
}
