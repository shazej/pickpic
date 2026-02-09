
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query, sql } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const session = await auth();
        const body = await req.json();
        const { searchLogId, score, comment } = body;

        // Score must be 1 or -1
        if (![1, -1].includes(score)) {
            return new NextResponse('Invalid score', { status: 400 });
        }

        await query(
            `INSERT INTO ai_feedback (search_log_id, user_id, score, comment) 
             VALUES (@logId, @userId, @score, @comment)`,
            [
                { name: 'logId', value: searchLogId || null, type: sql.BigInt },
                { name: 'userId', value: session?.user?.id || null, type: sql.UniqueIdentifier },
                { name: 'score', value: score, type: sql.Int },
                { name: 'comment', value: comment || null, type: sql.NVarChar }
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Feedback Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
