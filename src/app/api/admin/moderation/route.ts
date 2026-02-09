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

        const reportsRes = await query(`
            SELECT m.id, m.target_type, m.target_id, m.reason_category, m.details, m.status, m.created_at,
                   u.email as reporter_email
            FROM moderation.reports m
            LEFT JOIN auth.Users u ON m.reporter_id = u.id
            WHERE m.status = @status
            ORDER BY m.created_at ASC
        `, [
            { name: 'status', value: status, type: sql.VarChar }
        ]);

        return NextResponse.json({
            reports: reportsRes.recordset
        });

    } catch (error) {
        console.error('Admin moderation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { reportId, status, resolutionNotes } = await req.json();

        if (!reportId || !['RESOLVED', 'DISMISSED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        await query(`
            UPDATE moderation.reports
            SET status = @status, 
                resolution_notes = @notes,
                resolved_by = @adminId,
                resolved_at = SYSDATETIME()
            WHERE id = @reportId
        `, [
            { name: 'status', value: status, type: sql.VarChar },
            { name: 'notes', value: resolutionNotes || '', type: sql.NVarChar },
            { name: 'adminId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'reportId', value: reportId, type: sql.Int }
        ]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin moderation update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
