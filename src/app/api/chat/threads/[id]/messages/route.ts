
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

        // Verify access & Insert
        await query(`
           IF EXISTS (SELECT 1 FROM marketplace.MessageThreads WHERE id = @threadId AND (buyer_user_id = @userId OR seller_user_id = @userId))
           BEGIN
                INSERT INTO marketplace.Messages (thread_id, sender_user_id, body)
                VALUES (@threadId, @userId, @content);
                
                UPDATE marketplace.MessageThreads SET updated_at = SYSDATETIME() WHERE id = @threadId;
           END
        `, [
            { name: 'threadId', value: id, type: sql.UniqueIdentifier },
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'content', value: content, type: sql.NVarChar }
        ]);

        return NextResponse.json({ message: 'Message sent' });

    } catch (error) {
        console.error('Send Message Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
