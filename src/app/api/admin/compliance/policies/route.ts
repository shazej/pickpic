
import { NextResponse } from 'next/server';
import { ComplianceService } from '@/lib/services/compliance-service';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const country = searchParams.get('country');

        if (!country) return NextResponse.json({ error: 'Country required' }, { status: 400 });

        const policies = await ComplianceService.getPolicies(country);
        return NextResponse.json({ policies });
    } catch (error) {
        console.error('Get policies error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { countryIso, notes } = await req.json();

        const id = await ComplianceService.createPolicyDraft(countryIso, notes, session.user.id);

        return NextResponse.json({ id, status: 'Draft' });
    } catch (error) {
        console.error('Create policy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
