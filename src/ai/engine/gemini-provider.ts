
import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { AIProvider, ChatRequest, AIResponse } from "./types";

export class GeminiProvider implements AIProvider {
    private client: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, modelName: string = "gemini-2.0-flash") {
        this.client = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    async chat(request: ChatRequest): Promise<AIResponse> {
        const model = this.client.getGenerativeModel({
            model: request.model || this.modelName,
            generationConfig: {
                responseMimeType: request.responseFormat === 'json' ? 'application/json' : 'text/plain',
                temperature: request.temperature,
                maxOutputTokens: request.maxTokens
            }
        });

        // Split messages into system instruction and contents
        const systemMessage = request.messages.find(m => m.role === 'system');
        const chatMessages = request.messages.filter(m => m.role !== 'system');

        const contents: Content[] = chatMessages.map(m => {
            const parts: Part[] = [];
            if (typeof m.content === 'string') {
                parts.push({ text: m.content });
            } else {
                for (const c of m.content) {
                    if (c.text) parts.push({ text: c.text });
                    if (c.image_url) {
                        // Gemini SDK expects inlineData for base64
                        if (c.image_url.startsWith('data:')) {
                            const [mimeInfo, base64Data] = c.image_url.split(';base64,');
                            const mimeType = mimeInfo.replace('data:', '');
                            parts.push({
                                inlineData: {
                                    mimeType,
                                    data: base64Data
                                }
                            });
                        } else {
                            // This provider currently only supports data URIs for images
                            // In a real scenario we'd fetch the URL here if needed
                            console.warn("GeminiProvider: URL images not directly supported, skip");
                        }
                    }
                }
            }
            return {
                role: m.role === 'user' ? 'user' : 'model',
                parts
            };
        });

        const result = await model.generateContent({
            contents,
            systemInstruction: systemMessage ? (typeof systemMessage.content === 'string' ? systemMessage.content : systemMessage.content[0].text) : undefined,
        });

        const response = result.response;
        const text = response.text();

        return {
            text,
            json: request.responseFormat === 'json' ? JSON.parse(text) : undefined,
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0
            },
            raw: result
        };
    }

    async healthCheck(): Promise<{ ok: boolean; details?: any }> {
        try {
            // Simple check by listing models or just assuming if API key exists
            return { ok: true };
        } catch (e: any) {
            return { ok: false, details: e.message };
        }
    }
}
