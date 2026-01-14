import { NextResponse } from 'next/server';
import { sql, query } from '@/lib/db';

export async function GET() {
    try {
        // Check DB connection
        await query('SELECT 1');

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: 'healthy',
                auth: 'healthy' // implicit if app is running
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            services: {
                database: 'unhealthy'
            }
        }, { status: 503 });
    }
}
