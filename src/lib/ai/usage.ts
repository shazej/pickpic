import { query, sql } from "@/lib/db";

export interface AIUsageRecord {
    userId?: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestId: string;
    latencyMs: number;
    route: string;
}

export async function recordAIUsage(record: AIUsageRecord) {
    try {
        await query(
            `INSERT INTO ai_usage (user_id, model, prompt_tokens, completion_tokens, total_tokens, request_id, latency_ms, route)
       VALUES (@userId, @model, @promptTokens, @completionTokens, @totalTokens, @requestId, @latencyMs, @route)`,
            [
                { name: 'userId', value: record.userId || null, type: sql.UniqueIdentifier },
                { name: 'model', value: record.model, type: sql.NVarChar },
                { name: 'promptTokens', value: record.promptTokens, type: sql.Int },
                { name: 'completionTokens', value: record.completionTokens, type: sql.Int },
                { name: 'totalTokens', value: record.totalTokens, type: sql.Int },
                { name: 'requestId', value: record.requestId, type: sql.UniqueIdentifier },
                { name: 'latencyMs', value: record.latencyMs, type: sql.Int },
                { name: 'route', value: record.route, type: sql.NVarChar },
            ]
        );
        console.log(`[AI Usage] Recorded ${record.totalTokens} tokens for ${record.route} (Req: ${record.requestId})`);
    } catch (error) {
        console.error("[AI Usage] Failed to record usage:", error);
        // Don't throw, we don't want to break the user flow for a metrics error
    }
}
