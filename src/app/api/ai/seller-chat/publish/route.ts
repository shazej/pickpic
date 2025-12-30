
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { session_id } = body;

        // 1. Fetch Session
        const sessionResult = await query(
            `SELECT * FROM marketplace.listing_assistant_sessions WHERE id = @sessionId`,
            [{ name: 'sessionId', value: session_id, type: sql.UniqueIdentifier }]
        );

        if (sessionResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const assistantSession = sessionResult.recordset[0];
        const state = JSON.parse(assistantSession.current_state_json || '{}');

        // 2. Validate Minimum Requirements
        const required = ['title', 'price', 'category', 'condition'];
        const missing = required.filter(f => !state[f] || (f === 'price' && state[f] <= 0));

        if (missing.length > 0) {
            return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
        }

        // 3. Finalize Product Status
        await query(
            `UPDATE marketplace.Products 
             SET status = 'published', updated_at = SYSDATETIME() 
             WHERE id = @productId`,
            [{ name: 'productId', value: assistantSession.product_id, type: sql.UniqueIdentifier }]
        );

        // 4. Close Session
        await query(
            `UPDATE marketplace.listing_assistant_sessions 
             SET status = 'completed', updated_at = SYSDATETIME() 
             WHERE id = @sessionId`,
            [{ name: 'sessionId', value: session_id, type: sql.UniqueIdentifier }]
        );

        return NextResponse.json({ success: true, product_id: assistantSession.product_id });

    } catch (error) {
        console.error('Seller Chat Publish API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
