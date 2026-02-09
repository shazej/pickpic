
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

        const body = await req.json();
        const { countryIso, title, content, sourceRefs, tags, proposedRulesJson } = body;

        // Resolve Country ID
        const pool = await getPool();
        const cRes = await pool.request()
            .input('iso', sql.NVarChar, countryIso)
            .query('SELECT id FROM compliance.Countries WHERE iso_code = @iso');

        if (!cRes.recordset[0]) return NextResponse.json({ error: 'Invalid Country' }, { status: 400 });
        const countryId = cRes.recordset[0].id;

        // 1. Create KB Draft
        const kbId = await ComplianceService.createKBDraft({
            countryId,
            title,
            content,
            sourceRefs,
            tags
        });

        // 2. Draft Rules if provided (Optional)
        // If proposedRulesJson is present, we might want to attach them to a "Draft Policy"
        // But the requirement says "optional Draft rules". 
        // We'll create a new Draft Policy if none exists, or fetch latest Draft.

        if (proposedRulesJson) {
            // Look for existing draft policy
            const pRes = await pool.request()
                .input('cid', sql.Int, countryId)
                .query("SELECT TOP 1 id FROM compliance.Policies WHERE country_id = @cid AND status = 'Draft' ORDER BY version DESC");

            let policyId = pRes.recordset[0]?.id;
            if (!policyId) {
                // Create new draft policy
                policyId = await ComplianceService.createPolicyDraft(countryIso, "Auto-created from Chat", session.user.id);
            }

            // Upsert rules
            try {
                const rules = JSON.parse(proposedRulesJson);
                if (Array.isArray(rules)) {
                    for (const r of rules) {
                        await ComplianceService.upsertRule(policyId, r);
                    }
                }
            } catch (e) {
                console.warn("Failed to process proposed rules", e);
            }
        }

        return NextResponse.json({ success: true, kbId });

    } catch (error) {
        console.error('KB from Chat error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
