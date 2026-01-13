
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        // Verify access
        const accessCheck = await query(`
            SELECT 1 FROM marketplace.MessageThreads 
            WHERE id = @id AND (buyer_user_id = @userId OR seller_user_id = @userId)
        `, [
            { name: 'id', value: id, type: sql.UniqueIdentifier },
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }
        ]);

        if (accessCheck.recordset.length === 0) {
            return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
        }

        const messages = await query(`
            SELECT id, sender_user_id, body, created_at
            FROM marketplace.Messages
            WHERE thread_id = @id
            ORDER BY created_at ASC
        `, [{ name: 'id', value: id, type: sql.UniqueIdentifier }]);

        return NextResponse.json({
            messages: messages.recordset.map(m => ({
                id: m.id,
                senderId: m.sender_user_id === session.user.id ? 'me' : m.sender_user_id,
                content: m.body,
                timestamp: m.created_at
            }))
        });

    } catch (error) {
        console.error('Get Messages Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const { content } = await request.json();

        // 1. Verify access & Get Thread Details
        const threadRes = await query(`
            SELECT mt.id, mt.product_id, mt.buyer_user_id, mt.seller_user_id,
                   p.title, p.description, p.currency
            FROM marketplace.MessageThreads mt
            JOIN marketplace.Products p ON mt.product_id = p.id
            WHERE mt.id = @threadId AND (mt.buyer_user_id = @userId OR mt.seller_user_id = @userId)
        `, [
            { name: 'threadId', value: id, type: sql.UniqueIdentifier },
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }
        ]);

        if (threadRes.recordset.length === 0) {
            return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
        }

        const thread = threadRes.recordset[0];
        const isBuyer = thread.buyer_user_id === session.user.id;
        // The sender is the current user.
        // The recipient is the other party.
        const recipientId = isBuyer ? thread.seller_user_id : thread.buyer_user_id;

        // 2. Insert USER Message
        await query(`
            INSERT INTO marketplace.Messages (thread_id, sender_user_id, body)
            VALUES (@threadId, @userId, @content);
            
            UPDATE marketplace.MessageThreads SET updated_at = SYSDATETIME() WHERE id = @threadId;
        `, [
            { name: 'threadId', value: id, type: sql.UniqueIdentifier },
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'content', value: content, type: sql.NVarChar }
        ]);

        // 3. TRIGGER AI (If User is Buyer, AI replies as Seller Agent)
        // In a real app, we'd check if Seller has AI enabled. For this MVP Verification, we ALWAYS reply.
        if (isBuyer) {
            // Fetch History
            const historyRes = await query(`
                SELECT sender_user_id, body FROM marketplace.Messages 
                WHERE thread_id = @id 
                ORDER BY created_at ASC
             `, [{ name: 'id', value: id, type: sql.UniqueIdentifier }]);

            const history = historyRes.recordset.map(m => ({
                role: m.sender_user_id === session.user.id ? 'user' : 'model',
                content: m.body
            }));

            // Mock Product Attributes/Image count for now or fetch if needed
            const product = {
                id: thread.product_id,
                title: thread.title,
                description: thread.description || "Great product",
                attributes: {}
            };

            // Call AI
            const aiResponse = await import('@/services/ai-service').then(m => m.AiService.getBuyerChatResponse({
                product,
                message: content,
                history,
                imageCount: 1, // Mock
                userId: session.user.id,
                sellerLocation: "Unknown"
            }));

            if (aiResponse && aiResponse.reply) {
                // Save AI Reply as Seller
                await query(`
                    INSERT INTO marketplace.Messages (thread_id, sender_user_id, body)
                    VALUES (@threadId, @senderId, @content);
                    
                    UPDATE marketplace.MessageThreads SET updated_at = SYSDATETIME() WHERE id = @threadId;
                `, [
                    { name: 'threadId', value: id, type: sql.UniqueIdentifier },
                    { name: 'senderId', value: recipientId, type: sql.UniqueIdentifier }, // AI acts as recipient
                    { name: 'content', value: aiResponse.reply, type: sql.NVarChar }
                ]);
            }
        }

        return NextResponse.json({ message: 'Message sent' });

    } catch (error) {
        console.error('Send Message Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

