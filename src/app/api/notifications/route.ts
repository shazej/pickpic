import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, sql } from '@/lib/db';

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await query(`
        SELECT top 20 * FROM notifications.Notifications
        WHERE user_id = @userId
        ORDER BY created_at DESC
    `, [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);

    // Query unread count
    const countRes = await query(`
        SELECT COUNT(*) as count FROM notifications.Notifications
        WHERE user_id = @userId AND is_read = 0
    `, [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);

    return NextResponse.json({
        notifications: res.recordset,
        unreadCount: countRes.recordset[0].count
    });
}

// Mark as read
export async function PATCH(req: Request) {
    const session = await getSession();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();

    if (id === 'all') {
         await query(`UPDATE notifications.Notifications SET is_read = 1 WHERE user_id = @userId`, 
             [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);
    } else {
         await query(`UPDATE notifications.Notifications SET is_read = 1 WHERE id = @id AND user_id = @userId`, 
             [{ name: 'id', value: id, type: sql.UniqueIdentifier }, { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);
    }

    return NextResponse.json({ success: true });
}
