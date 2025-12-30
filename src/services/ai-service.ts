
import { runBuyerChat, runSellerChat } from '@/lib/genkit/flows';
import { query } from '@/lib/db';

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

    static async getBuyerChatResponse(params: {
        product: any,
        message: string,
        history: any[],
        imageCount: number,
        userId: string | null
    }) {
        let retries = 2;
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
                    throw error;
                }
                retries--;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    static async getSellerChatResponse(params: {
        draft: any,
        answer: string,
        sellerId: string
    }) {
        let retries = 2;
        while (retries >= 0) {
            try {
                const start = Date.now();
                const result = await runSellerChat(params);
                const latency = Date.now() - start;

                await this.logUsage(params.sellerId, 'seller_chat', {
                    latency_ms: latency
                });

                return result;
            } catch (error) {
                if (retries === 0) {
                    await this.logError('seller_chat', error, { seller_id: params.sellerId });
                    throw error;
                }
                retries--;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
}
