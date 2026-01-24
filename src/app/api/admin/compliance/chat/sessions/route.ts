
import { NextResponse } from 'next/server';
import { AdminComplianceChatService } from '@/lib/services/admin-chat-service';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { countryIso } = await req.json();
        if (!countryIso) return NextResponse.json({ error: 'Country ISO required' }, { status: 400 });

        const sessionId = await AdminComplianceChatService.createSession(countryIso, session.user.id);

        return NextResponse.json({ sessionId });

    } catch (error) {
        console.error('Create Chat Session error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
