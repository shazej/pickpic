
import { NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getSession } from '@/lib/auth';
import { getPool, sql } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const resolvedParams = await params;
        const kbId = resolvedParams.id;

        // Validation: Must have source refs
        const pool = await getPool();
        const kbRes = await pool.request()
            .input('id', sql.UniqueIdentifier, kbId)
            .query('SELECT source_refs FROM compliance.KnowledgeBase WHERE id = @id');

        if (!kbRes.recordset[0]) return NextResponse.json({ error: 'KB Not Found' }, { status: 404 });

        const refs = kbRes.recordset[0].source_refs ? JSON.parse(kbRes.recordset[0].source_refs) : [];
        if (!refs || refs.length === 0) {
            return NextResponse.json({ error: 'Cannot publish without source references' }, { status: 400 });
        }

        await ComplianceService.publishKB(kbId);

        // Audit Log
        await pool.request()
            .input('actor', sql.UniqueIdentifier, session.user.id)
            .input('action', sql.VarChar, 'PUBLISH_KB')
            .input('entity', sql.VarChar, 'KB')
            .input('eid', sql.VarChar, kbId)
            .query(`INSERT INTO audit.events (actor_id, action, entity_type, entity_id) VALUES (@actor, @action, @entity, @eid)`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Publish KB error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
