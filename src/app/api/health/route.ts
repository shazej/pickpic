
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import os from 'os';

export async function GET() {
    const start = Date.now();
    let dbStatus = 'unknown';

    // Check DB
    try {
        await query('SELECT 1');
        dbStatus = 'healthy';
    } catch (e) {
        dbStatus = 'unhealthy';
    }

    const duration = Date.now() - start;

    const health = {
        status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
            database: dbStatus,
            uptime: process.uptime(),
            load: os.loadavg(),
            memory: process.memoryUsage(),
            latency: `${duration}ms`
        }
    };

    return NextResponse.json(health, {
        status: dbStatus === 'healthy' ? 200 : 503
    });
}
