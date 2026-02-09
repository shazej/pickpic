
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sessionId = params.id;

        const sessionResult = await query(
            `SELECT * FROM marketplace.listing_assistant_sessions WHERE id = @sessionId`,
            [{ name: 'sessionId', value: sessionId, type: sql.UniqueIdentifier }]
        );

        if (sessionResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const assistantSession = sessionResult.recordset[0];
        const state = JSON.parse(assistantSession.current_state_json || '{}');

        // Check if current user is the owner (seller)
        const sellerResult = await query(
            `SELECT user_id FROM marketplace.SellerProfiles WHERE id = @sellerId`,
            [{ name: 'sellerId', value: assistantSession.seller_id, type: sql.UniqueIdentifier }]
        );

        if (sellerResult.recordset.length === 0 || sellerResult.recordset[0].user_id !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            session_id: assistantSession.id,
            status: assistantSession.status,
            current_state: state,
            created_at: assistantSession.created_at,
            updated_at: assistantSession.updated_at
        });

    } catch (error) {
        console.error('Get Seller Session Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
