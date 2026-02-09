import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';
import { processListingAnswer, generateListingQuestion } from '@/ai/flows/listing-assistant';

export async function POST(req: Request) {
    try {
        const { session_id, answer_text, question_key } = await req.json();

        const pool = await getPool();

        // Get Session Context
        const sessionResult = await pool.request()
            .input('id', sql.UniqueIdentifier, session_id)
            .query('SELECT context_data FROM listing_assistant_sessions WHERE id = @id');

        if (sessionResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const currentState = JSON.parse(sessionResult.recordset[0].context_data);

        // Process Answer
        const processed = await processListingAnswer.run({
            state: currentState,
            question_key: question_key,
            user_answer: answer_text,
        });

        const newState = processed.updated_state;

        // Save Answer to History
        await pool.request()
            .input('session_id', sql.UniqueIdentifier, session_id)
            .input('role', sql.NVarChar, 'user')
            .input('content', sql.NVarChar(sql.MAX), answer_text)
            .query(`
                INSERT INTO listing_assistant_conversation(session_id, role, content)
                VALUES(@session_id, @role, @content)
            `);

        let nextQuestion = null;

        if (!processed.is_complete) {
            // Generate Next Question
            nextQuestion = await generateListingQuestion.run({
                state: newState,
                image_url: newState.images?.[0]
            });

            // Save New Question
            await pool.request()
                .input('session_id', sql.UniqueIdentifier, session_id)
                .input('role', sql.NVarChar, 'assistant')
                .input('message_type', sql.NVarChar, 'question')
                .input('content', sql.NVarChar(sql.MAX), nextQuestion.question_text)
                .input('meta_data', sql.NVarChar(sql.MAX), JSON.stringify(nextQuestion))
                .query(`
                    INSERT INTO listing_assistant_conversation(session_id, role, content, message_type, meta_data)
                    VALUES(@session_id, @role, @content, @message_type, @meta_data)
                `);
        }

        // Update Session State
        await pool.request()
            .input('id', sql.UniqueIdentifier, session_id)
            .input('context_data', sql.NVarChar(sql.MAX), JSON.stringify(newState))
            .input('status', sql.NVarChar, processed.is_complete ? 'completed' : 'active')
            .query('UPDATE listing_assistant_sessions SET context_data = @context_data, status = @status WHERE id = @id');

        return NextResponse.json({
            updated_state: newState,
            next_question: nextQuestion,
            is_complete: processed.is_complete,
            message: processed.message_to_user
        });

    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
