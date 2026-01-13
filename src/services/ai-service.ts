
import { runBuyerChat, runSellerChat } from '@/lib/genkit/flows';
import { query } from '@/lib/db';
import { aiEngine } from '@/ai/engine/service';
import { ChatRequest } from '@/ai/engine/types';

export class AiService {
    static async logUsage(userId: string | null, feature: string, metadata: any) {
        try {
            await query(
                `INSERT INTO billing.usage_events (user_id, feature_name, metadata_json) 
                 VALUES (@userId, @feature, @metadata)`,
                [
                    { name: 'userId', value: userId },
                    { name: 'feature', value: feature },
                    { name: 'metadata', value: JSON.stringify(metadata) }
                ]
            );
        } catch (e) {
            console.error("Failed to log usage:", e);
        }
    }

    static async logError(service: string, error: any, metadata?: any) {
        try {
            await query(
                `INSERT INTO ai.error_log (service_name, error_message, stack_trace, metadata_json) 
                 VALUES (@service, @msg, @stack, @metadata)`,
                [
                    { name: 'service', value: service },
                    { name: 'msg', value: error.message || String(error) },
                    { name: 'stack', value: error.stack || null },
                    { name: 'metadata', value: JSON.stringify(metadata || {}) }
                ]
            );
        } catch (e) {
            console.error("Failed to log error:", e);
        }
    }

    /**
     * Generic chat interface using the provider-agnostic engine
     */
    static async chat(request: ChatRequest, userId: string | null = null, feature: string = 'general_chat') {
        const start = Date.now();
        try {
            const result = await aiEngine.chat(request);
            const latency = Date.now() - start;

            await this.logUsage(userId, feature, {
                latency_ms: latency,
                provider: (await aiEngine.getConfig()).provider
            });

            return result;
        } catch (error) {
            await this.logError(feature, error);
            throw error;
        }
    }

    static async getBuyerChatResponse(params: {
        product: any,
        message: string,
        history: any[],
        imageCount: number,
        userId: string | null,
        sellerLocation?: string
    }) {
        let retries = 1;
        while (retries >= 0) {
            try {
                const start = Date.now();
                const result = await runBuyerChat(params);
                const latency = Date.now() - start;

                await this.logUsage(params.userId, 'buyer_chat', {
                    product_id: params.product.id,
                    latency_ms: latency
                });

                return result;
            } catch (error) {
                if (retries === 0) {
                    await this.logError('buyer_chat', error, { product_id: params.product.id });

                    // Mock Fallback for Buyer
                    const mockResponse = {
                        content: "I'm sorry, I'm having trouble connecting to my AI brain right now. Based on the product details: this is a " + (params.product.title || "great item") + ". How else can I help?",
                        suggested_questions: ["Is this still available?", "What is the condition?"],
                        citations: []
                    };
                    return mockResponse;
                }
                retries--;
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }

    static async getSellerChatResponse(params: {
        draft: any,
        answer: string,
        sellerId: string,
        imageUrl?: string
    }) {
        try {
            // Simple progression: Find first unanswered question
            const mock_questions = [
                { question_key: 'brand', question_text: 'What is the brand of this item?', suggestions: ['Canon', 'Nikon', 'Sony', 'Other'] },
                { question_key: 'condition', question_text: 'What is the condition?', suggestions: ['New', 'Like New', 'Good', 'Fair'] },
                { question_key: 'price', question_text: 'What price are you looking for?', suggestions: ['50', '100', '200'] }
            ];
            const mock_attributes = params.draft?.attributes || params.draft || {};

            if (params.answer === "Initial analysis of the image.") {
                return {
                    next_question: mock_questions[0],
                    updated_fields: {},
                    progress: { required_complete: false, missing: ['brand', 'condition', 'price'] },
                    feedback: "I see the photo. Let's start with some details.",
                    suggestions: []
                };
            }

            const answered_q = mock_questions.find(q => !mock_attributes[q.question_key]);

            const updated_fields: any = {
                attributes: {}
            };
            if (answered_q) {
                updated_fields[answered_q.question_key] = params.answer;
                updated_fields.attributes[answered_q.question_key] = params.answer;
            }

            const answered_index = answered_q ? mock_questions.indexOf(answered_q) : -1;
            const next_q = (answered_index !== -1 && answered_index + 1 < mock_questions.length)
                ? mock_questions[answered_index + 1]
                : null;

            return {
                next_question: next_q,
                updated_fields: updated_fields,
                progress: {
                    required_complete: !next_q,
                    missing: next_q ? mock_questions.slice(mock_questions.indexOf(next_q)).map(q => q.question_key) : []
                },
                feedback: next_q ? "Got it. Next question..." : "Listing complete!",
                suggestions: []
            };
        } catch (error) {
            await this.logError('seller_chat', error, { seller_id: params.sellerId });
            return null;
        }
    }

    // Verify that the configured AI provider is reachable
    static async verifyProvider(providerName: string): Promise<boolean> {
        try {
            const config = await aiEngine.getConfig();
            if (config.provider !== providerName) return false;
            // Simple ping to ensure provider is reachable
            await aiEngine.chat({ messages: [{ role: 'user', content: 'ping' }] });
            return true;
        } catch (e) {
            console.error('Provider verification failed:', e);
            return false;
        }
    }
}

