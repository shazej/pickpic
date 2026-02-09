import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'PENDING';

        const sellersRes = await query(`
            SELECT sp.user_id, sp.store_name, sp.bio, sp.location_precision, sp.approval_status, sp.updated_at,
                   u.email
            FROM marketplace.SellerProfiles sp
            JOIN auth.Users u ON sp.user_id = u.id
            WHERE sp.approval_status = @status
            ORDER BY sp.updated_at DESC
        `, [
            { name: 'status', value: status, type: sql.NVarChar }
        ]);

        return NextResponse.json({
            sellers: sellersRes.recordset
        });

    } catch (error) {
        console.error('Admin sellers error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId, status } = await req.json();

        if (!userId || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        await query(`
            UPDATE marketplace.SellerProfiles
            SET approval_status = @status,
                updated_at = SYSDATETIME()
            WHERE user_id = @userId
        `, [
            { name: 'status', value: status, type: sql.NVarChar },
            { name: 'userId', value: userId, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin seller update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
