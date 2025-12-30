import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const flagsRes = await query('SELECT key_name, is_enabled, description FROM settings.feature_flags');

        return NextResponse.json({
            flags: flagsRes.recordset
        });

    } catch (error) {
        console.error('Admin settings error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { key_name, is_enabled } = await req.json();

        await query(`
            UPDATE settings.feature_flags
            SET is_enabled = @enabled, 
                updated_at = SYSDATETIME(),
                updated_by = @adminId
            WHERE key_name = @key
        `, [
            { name: 'enabled', value: is_enabled ? 1 : 0, type: sql.Bit },
            { name: 'adminId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'key', value: key_name, type: sql.VarChar }
        ]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin settings update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
