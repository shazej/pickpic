
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

    // Check AI Engine
    try {
        const { aiEngine } = await import('@/ai/engine/service');
        const aiStatus = await aiEngine.healthCheck();
        health.ai_engine = aiStatus;
        if (aiStatus.status === 'unhealthy') {
            health.status = 'degraded';
        }
    } catch (e: any) {
        console.error("Health Check AI Engine Error:", e);
        health.ai_engine = { status: 'error', details: e.message };
        health.status = 'degraded';
    }

    return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
}
