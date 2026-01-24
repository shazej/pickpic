
import { NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const resolvedParams = await params;
        const policyId = resolvedParams.id;
        const body = await req.json(); // Expect Partial<ComplianceRule>

        await ComplianceService.upsertRule(policyId, body);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Upsert rule error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
