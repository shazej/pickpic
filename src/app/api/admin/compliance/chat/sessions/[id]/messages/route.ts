
import { NextResponse } from 'next/server';
import { AdminComplianceChatService } from '@/lib/services/admin-chat-service';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const resolvedParams = await params;
        const sessionId = resolvedParams.id;
        const { message } = await req.json();

        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

        const result = await AdminComplianceChatService.processUserMessage(sessionId, message, session.user.id);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Chat message error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
