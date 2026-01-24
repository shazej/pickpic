
import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const resolvedParams = await params;
        const tenantId = resolvedParams.tenantId; // In single-tenant app this might be 'default' or ignored

        const { complianceCountryIso } = await req.json();

        if (!complianceCountryIso || complianceCountryIso.length !== 2) {
            return NextResponse.json({ error: 'Invalid ISO Code' }, { status: 400 });
        }

        const pool = await getPool();

        // Audit Log (Simplified)
        await pool.request()
            .input('actor', sql.UniqueIdentifier, session.user.id)
            .input('action', sql.VarChar, 'UPDATE_TENANT_COUNTRY')
            .input('entity', sql.VarChar, 'Tenant')
            .input('eid', sql.VarChar, tenantId)
            .input('details', sql.NVarChar, JSON.stringify({ newCountry: complianceCountryIso }))
            .query(`INSERT INTO audit.events (actor_id, action, entity_type, entity_id, details) VALUES (@actor, @action, @entity, @eid, @details)`);

        // Update
        // "Default Tenant" is hardcoded for now as per schema seed
        await pool.request()
            .input('iso', sql.Char(2), complianceCountryIso)
            .query(`UPDATE compliance.Tenants SET compliance_country_iso = @iso WHERE name = 'Default Tenant'`);

        return NextResponse.json({ success: true, complianceCountryIso });

    } catch (error) {
        console.error('Update tenant compliance error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
