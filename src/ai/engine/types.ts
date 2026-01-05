
export interface ChatMessage {
    role: 'user' | 'model' | 'system';
    content: string | Array<{ text?: string; image_url?: string; mime_type?: string }>;
}

export interface ChatRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
}

export interface AIResponse {
    text: string;
    json?: any;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    raw?: any;
}

export interface AIProvider {
    chat(request: ChatRequest): Promise<AIResponse>;
    healthCheck(): Promise<{ ok: boolean; details?: any }>;
}

export type ProviderType = 'gemini' | 'openai' | 'ollama';

export interface AIConfig {
    provider: ProviderType;
    model: string;
    ollamaBaseUrl?: string;
    apiKey?: string;
}
