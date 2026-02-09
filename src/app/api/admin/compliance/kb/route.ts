
import { NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getSession } from '@/lib/auth';
import { getPool, sql } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const country = searchParams.get('country');
        const status = searchParams.get('status');

        if (!country) return NextResponse.json({ error: 'Country required' }, { status: 400 });

        const pool = await getPool();
        // Extending service or direct query for admin listing with status filter
        // Service.getActiveKB only returns Active. Admin needs Drafts too.

        let queryStr = `
            SELECT k.* 
            FROM compliance.KnowledgeBase k
            JOIN compliance.Countries c ON k.country_id = c.id
            WHERE c.iso_code = @iso
        `;

        if (status) {
            queryStr += ` AND k.status = @status`;
        }

        queryStr += ` ORDER BY k.updated_at DESC`;

        const res = await pool.request()
            .input('iso', sql.NVarChar, country)
            .input('status', sql.NVarChar, status)
            .query(queryStr);

        return NextResponse.json({ kb: res.recordset });

    } catch (error) {
        console.error('Get KB error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        // body: { countryIso, title, content, sourceRefs, tags } where countryIso is converted to countryId inside service if needed

        // We need to resolve countryIso to ID for the service call, 
        // OR update service to accept ISO. My service implementation accepted ID in `createKBDraft`.
        // Let's do a quick lookup here or update service.
        // I prefer updating helper in service or just doing lookup here.

        const pool = await getPool();
        const cRes = await pool.request()
            .input('iso', sql.NVarChar, body.countryIso)
            .query('SELECT id FROM compliance.Countries WHERE iso_code = @iso');

        if (!cRes.recordset[0]) return NextResponse.json({ error: 'Invalid Country' }, { status: 400 });

        const countryId = cRes.recordset[0].id;

        const id = await ComplianceService.createKBDraft({
            countryId,
            title: body.title,
            content: body.content,
            sourceRefs: body.sourceRefs,
            tags: body.tags
        });

        return NextResponse.json({ id, status: 'Draft' });

    } catch (error) {
        console.error('Create KB error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
