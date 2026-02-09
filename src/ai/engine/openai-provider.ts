
import { AIProvider, ChatRequest, AIResponse } from "./types";

export class OpenAIProvider implements AIProvider {
    private apiKey: string;
    private modelName: string;

    constructor(apiKey: string, modelName: string = "gpt-4o") {
        this.apiKey = apiKey;
        this.modelName = modelName;
    }

    async chat(request: ChatRequest): Promise<AIResponse> {
        const url = "https://api.openai.com/v1/chat/completions";

        const messages = request.messages.map(m => {
            if (typeof m.content === 'string') {
                return { role: m.role === 'model' ? 'assistant' : m.role, content: m.content };
            } else {
                const contentParts = m.content.map(c => {
                    if (c.text) return { type: 'text', text: c.text };
                    if (c.image_url) return { type: 'image_url', image_url: { url: c.image_url } };
                    return null;
                }).filter(Boolean);
                return { role: m.role === 'model' ? 'assistant' : m.role, content: contentParts };
            }
        });

        const body: any = {
            model: request.model || this.modelName,
            messages: messages,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
        };

        if (request.responseFormat === 'json') {
            body.response_format = { type: "json_object" };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(`OpenAI Error: ${JSON.stringify(error)}`);
        }

        const data = await res.json();
        const text = data.choices[0].message.content;

        return {
            text,
            json: request.responseFormat === 'json' ? JSON.parse(text) : undefined,
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            },
            raw: data
        };
    }

    async healthCheck(): Promise<{ ok: boolean; details?: any }> {
        // Basic check could be calling models list
        return { ok: !!this.apiKey };
    }
}
