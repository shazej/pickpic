
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    // Protected: Admin/Internal Only
    const session = await getSession();
    // In real world, use API Key or Internal IP check.
    // For now, allow Admins.
    const isAdmin = session?.user?.roles?.includes('admin');

    if (!isAdmin) {
        // Fallback for demo: Allow if localhost or secret header? 
        // Strict: 403
        return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    // Collect Metrics

    // 1. AI Anomalies (Example: Users with > 50 calls in 24h)
    const aiUsage = await query(`
        SELECT user_id, COUNT(*) as call_count 
        FROM audit.SearchEvents 
        WHERE created_at > DATEADD(hour, -24, GETDATE()) 
        GROUP BY user_id 
        HAVING COUNT(*) > 50
    `);

    // 2. Error Rate (simulated count log)
    // 3. Thread Activity
    const threads = await query(`
        SELECT COUNT(*) as recent_threads 
        FROM marketplace.MessageThreads 
        WHERE created_at > DATEADD(hour, -24, GETDATE())
    `);

    return NextResponse.json({
        ai_anomalies: aiUsage.recordset,
        activity: {
            threads_24h: threads.recordset[0].recent_threads
        },
        system: {
            node_env: process.env.NODE_ENV,
            memory: process.memoryUsage()
        }
    });

}
