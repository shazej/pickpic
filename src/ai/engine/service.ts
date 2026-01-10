
import { query } from "@/lib/db";
import {
    AIProvider,
    ChatRequest,
    AIResponse,
    ProviderType,
    AIConfig
} from "./types";
import { GeminiProvider } from "./gemini-provider";
import { OpenAIProvider } from "./openai-provider";
import { OllamaProvider } from "./ollama-provider";
import { enforceJson, SYSTEM_PROMPT_PICKPIC } from "./utils";

export class AiEngineService {
    private static instance: AiEngineService;
    private providerCache: Map<string, AIProvider> = new Map();
    private currentConfig: AIConfig | null = null;

    private constructor() { }

    static getInstance(): AiEngineService {
        if (!AiEngineService.instance) {
            AiEngineService.instance = new AiEngineService();
        }
        return AiEngineService.instance;
    }

    /**
     * Resolves configuration with precedence:
     * 1. Per-request override (via options)
     * 2. DB settings (settings.system_config)
     * 3. ENV defaults
     */
    async getConfig(overrideProvider?: ProviderType): Promise<AIConfig> {
        // Base from ENV
        const config: AIConfig = {
            provider: (process.env.AI_PROVIDER as ProviderType) || 'gemini',
            model: process.env.AI_MODEL || 'gemini-1.5-flash',
            ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
        };

        // Fetch from DB
        try {
            const settingsRes = await query("SELECT key_name, value FROM settings.system_config WHERE key_name IN ('active_ai_provider', 'active_ai_model', 'ollama_base_url')");
            const settings = settingsRes.recordset.reduce((acc: any, row: any) => {
                acc[row.key_name] = row.value;
                return acc;
            }, {});

            if (settings.active_ai_provider) config.provider = settings.active_ai_provider as ProviderType;
            if (settings.active_ai_model) config.model = settings.active_ai_model;
            if (settings.ollama_base_url) config.ollamaBaseUrl = settings.ollama_base_url;

            // Re-resolve API Key based on provider
            if (config.provider === 'openai') {
                config.apiKey = process.env.OPENAI_API_KEY;
            } else if (config.provider === 'gemini') {
                config.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
            }
        } catch (e) {
            console.error("AiEngineService: Failed to fetch DB config, using ENV", e);
        }

        // Apply override
        if (overrideProvider) {
            config.provider = overrideProvider;
            if (overrideProvider === 'openai') config.apiKey = process.env.OPENAI_API_KEY;
            if (overrideProvider === 'gemini') config.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        }

        return config;
    }

    async getProvider(config: AIConfig): Promise<AIProvider> {
        const cacheKey = `${config.provider}:${config.model}:${config.ollamaBaseUrl}`;
        if (this.providerCache.has(cacheKey)) {
            return this.providerCache.get(cacheKey)!;
        }

        let provider: AIProvider;
        switch (config.provider) {
            case 'openai':
                provider = new OpenAIProvider(config.apiKey || '', config.model);
                break;
            case 'ollama':
                provider = new OllamaProvider(config.ollamaBaseUrl, config.model);
                break;
            default:
                provider = new GeminiProvider(config.apiKey || '', config.model);
        }

        this.providerCache.set(cacheKey, provider);
        return provider;
    }

    /**
     * Main chat entry point with automatic JSON enforcement
     */
    async chat(request: ChatRequest, options?: { provider?: ProviderType }): Promise<AIResponse> {
        const config = await this.getConfig(options?.provider);
        const provider = await this.getProvider(config);

        // Ensure system prompt is present if JSON requested
        if (request.responseFormat === 'json') {
            const hasSystem = request.messages.some(m => m.role === 'system');
            if (!hasSystem) {
                request.messages.unshift({ role: 'system', content: SYSTEM_PROMPT_PICKPIC });
            }
        }

        // SAFETY CHECK
        const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            const isSafe = await safetyGuard.validate(lastUserMessage.content as string);
            if (!isSafe) {
                throw new Error("Content Policy Violation: Request blocked by safety filters.");
            }
        }

        try {
            const response = await provider.chat(request);

            if (request.responseFormat === 'json') {
                response.json = await enforceJson(response.text, async (error) => {
                    console.warn(`Attempting JSON repair due to: ${error}`);
                    const repairRequest: ChatRequest = {
                        messages: [
                            ...request.messages,
                            { role: 'model', content: response.text },
                            { role: 'user', content: "Return ONLY valid JSON matching the schema. No extra text." }
                        ],
                        responseFormat: 'json',
                        temperature: 0.1
                    };
                    const repairResponse = await provider.chat(repairRequest);
                    return repairResponse.text;
                });
            }

            return response;
        } catch (error: any) {
            console.error(`AiEngineService Chat Error (${config.provider}):`, error);
            throw error;
        }
    }

    async healthCheck(): Promise<Record<string, any>> {
        const config = await this.getConfig();
        const provider = await this.getProvider(config);
        const status = await provider.healthCheck();

        return {
            provider: config.provider,
            model: config.model,
            status: status.ok ? 'healthy' : 'unhealthy',
            details: status.details
        };
    }

    /**
     * Clear cache when settings change
     */
    clearCache() {
        this.providerCache.clear();
    }
}

export const aiEngine = AiEngineService.getInstance();
