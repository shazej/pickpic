
import { NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getSession } from '@/lib/auth';
import { getPool, sql } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { policyId } = await req.json();

        await ComplianceService.publishPolicy(policyId, session.user.id);

        // Audit Log
        const pool = await getPool();
        await pool.request()
            .input('actor', sql.UniqueIdentifier, session.user.id)
            .input('action', sql.VarChar, 'PUBLISH_POLICY')
            .input('entity', sql.VarChar, 'Policy')
            .input('eid', sql.VarChar, policyId)
            .query(`INSERT INTO audit.events (actor_id, action, entity_type, entity_id) VALUES (@actor, @action, @entity, @eid)`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Publish policy error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
