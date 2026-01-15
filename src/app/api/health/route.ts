
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check DB
        await query('SELECT 1');

        const healthData = {
            status: 'ok',
            nodeVersion: process.version,
            timestamp: new Date().toISOString(),
            db: 'connected',
            env: process.env.NODE_ENV
        };

        return NextResponse.json(healthData, { status: 200 });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Health check failed',
            error: String(error)
        }, { status: 503 });
    }
}
