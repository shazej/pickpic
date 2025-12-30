
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const health: any = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
    };

    // Check Database
    try {
        const pool = await getPool();
        await pool.request().query('SELECT 1');
        health.database = 'connected';
    } catch (e: any) {
        health.database = 'disconnected';
        health.status = 'degraded';
        health.db_error = e.message;
    }

    // Check AI Provider (Google Generative AI SDK)
    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (apiKey && apiKey.length > 10) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            if (model) {
                health.ai_provider = 'configured';
            } else {
                health.ai_provider = 'error: model init failed';
            }
        } else {
            health.ai_provider = 'not_configured';
        }
    } catch (e: any) {
        console.error("Health Check AI Error:", e);
        health.ai_provider = 'error: ' + e.message;
    }

    return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
}
