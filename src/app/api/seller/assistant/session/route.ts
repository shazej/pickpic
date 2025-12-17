import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';
import { generateListingQuestion } from '@/ai/flows/listing-assistant';

export async function POST(req: Request) {
    try {
        const { image_url } = await req.json();

        // In a real app, get user from session. Mocking for now to match seeding
        // Assuming seller@example.com is the user.
        // We need to fetch the user ID from the database first.
        const pool = await getPool();

        // Find the seller user ID
        const userResult = await pool.request()
            .input('email', sql.NVarChar, 'seller@example.com')
            .query('SELECT id FROM users WHERE email = @email');

        if (userResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
        }
        const sellerId = userResult.recordset[0].id;

        // Initialize empty state
        const initialState = {
            images: image_url ? [image_url] : [],
            title: '',
            category: ''
        };

        // Generate First Question based on image
        const questionProto = await generateListingQuestion.run({
            state: initialState,
            image_url: image_url || undefined,
        });

        // Create Session
        const sessionId = (await pool.request().query('SELECT NEWID() as id')).recordset[0].id;

        await pool.request()
            .input('id', sql.UniqueIdentifier, sessionId)
            .input('seller_user_id', sql.UniqueIdentifier, sellerId)
            .input('context_data', sql.NVarChar(sql.MAX), JSON.stringify(initialState))
            .query(`
                INSERT INTO listing_assistant_sessions (id, seller_user_id, context_data)
                VALUES (@id, @seller_user_id, @context_data)
            `);

        // Save Question to History
        await pool.request()
            .input('session_id', sql.UniqueIdentifier, sessionId)
            .input('role', sql.NVarChar, 'assistant')
            .input('message_type', sql.NVarChar, 'question')
            .input('content', sql.NVarChar(sql.MAX), questionProto.question_text)
            .input('meta_data', sql.NVarChar(sql.MAX), JSON.stringify(questionProto))
            .query(`
                INSERT INTO listing_assistant_conversation (session_id, role, content, message_type, meta_data)
                VALUES (@session_id, @role, @content, @message_type, @meta_data)
            `);

        return NextResponse.json({
            session_id: sessionId,
            question: questionProto,
            current_state: initialState
        });
    } catch (error: any) {
        console.error('Session start error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
