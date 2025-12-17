
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Create Thread
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId, sellerId } = await request.json();

        // Check if thread exists
        const exists = await query(`
            SELECT id FROM marketplace.MessageThreads
            WHERE product_id = @productId AND buyer_user_id = @buyerId AND seller_user_id = @sellerId
        `, [
            { name: 'productId', value: productId, type: sql.UniqueIdentifier },
            { name: 'buyerId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier }
        ]);

        if (exists.recordset.length > 0) {
            return NextResponse.json({ id: exists.recordset[0].id });
        }

        // Create new
        const result = await query(`
            INSERT INTO marketplace.MessageThreads (buyer_user_id, seller_user_id, product_id)
            OUTPUT INSERTED.id
            VALUES (@buyerId, @sellerId, @productId)
        `, [
            { name: 'buyerId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier },
            { name: 'productId', value: productId, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ id: result.recordset[0].id });

    } catch (error) {
        console.error('Create Thread Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Get Threads
export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(`
            SELECT 
                mt.id, mt.product_id, mt.updated_at,
                p.title as product_title,
                (SELECT TOP 1 image_url FROM marketplace.ProductImages WHERE product_id = p.id AND is_primary = 1) as product_image,
                (SELECT TOP 1 body FROM marketplace.Messages WHERE thread_id = mt.id ORDER BY created_at DESC) as last_message,
                (SELECT TOP 1 created_at FROM marketplace.Messages WHERE thread_id = mt.id ORDER BY created_at DESC) as last_message_at,
                CASE 
                    WHEN mt.buyer_user_id = @userId THEN (SELECT display_name FROM auth.Users WHERE id = mt.seller_user_id)
                    ELSE (SELECT display_name FROM auth.Users WHERE id = mt.buyer_user_id)
                END as participant_name
            FROM marketplace.MessageThreads mt
            JOIN marketplace.Products p ON mt.product_id = p.id
            WHERE mt.buyer_user_id = @userId OR mt.seller_user_id = @userId
            ORDER BY mt.updated_at DESC
        `, [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);

        // Format for frontend
        const threads = result.recordset.map(r => ({
            id: r.id,
            productId: r.product_id,
            productTitle: r.product_title,
            productImage: r.product_image,
            lastMessage: r.last_message || 'No messages yet',
            lastMessageAt: r.last_message_at || r.updated_at,
            participantName: r.participant_name,
            participants: ['me', 'other'] // Mock for compat, or fetch real IDs
        }));

        return NextResponse.json({ threads });

    } catch (error) {
        console.error('Get Threads Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
