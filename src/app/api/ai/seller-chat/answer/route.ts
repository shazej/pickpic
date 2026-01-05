
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AiService } from '@/services/ai-service';
import { isRateLimited } from '@/lib/rate-limiter';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (isRateLimited(`seller_chat_${session.user.id}`, 20, 60000)) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait a minute.' }, { status: 429 });
        }

        const body = await request.json();
        const { session_id, answer_text, question_key } = body;

        if (!session_id || !answer_text) {
            return NextResponse.json({ error: 'Missing session_id or answer_text' }, { status: 400 });
        }

        // 1. Fetch Session and State
        const sessionResult = await query(
            `SELECT * FROM marketplace.listing_assistant_sessions WHERE id = @sessionId`,
            [{ name: 'sessionId', value: session_id, type: sql.UniqueIdentifier }]
        );

        if (sessionResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const assistantSession = sessionResult.recordset[0];
        let currentState = JSON.parse(assistantSession.current_state_json || '{}');

        // 2. Fetch/Save Answer
        const questionResult = await query(
            `SELECT id FROM marketplace.listing_assistant_questions 
             WHERE session_id = @sessionId AND question_key = @key 
             ORDER BY created_at DESC`,
            [
                { name: 'sessionId', value: session_id, type: sql.UniqueIdentifier },
                { name: 'key', value: question_key, type: sql.NVarChar }
            ]
        );

        if (questionResult.recordset.length > 0) {
            const questionId = questionResult.recordset[0].id;
            await query(
                `INSERT INTO marketplace.listing_assistant_answers (question_id, answer_text) VALUES (@qId, @text)`,
                [
                    { name: 'qId', value: questionId, type: sql.UniqueIdentifier },
                    { name: 'text', value: answer_text, type: sql.NVarChar }
                ]
            );
        }

        // 2.5 Fetch Image for context
        const imageResult = await query(
            `SELECT image_url FROM marketplace.ProductImages WHERE product_id = @pId AND is_primary = 1`,
            [{ name: 'pId', value: assistantSession.product_id, type: sql.UniqueIdentifier }]
        );
        const imageUrl = imageResult.recordset[0]?.image_url;

        // 3. Get AI Update and Next Question
        const aiResponse = await AiService.getSellerChatResponse({
            draft: currentState,
            answer: answer_text,
            sellerId: assistantSession.seller_id,
            imageUrl: imageUrl
        });

        if (!aiResponse) {
            throw new Error("Failed to get AI response");
        }

        // 4. Update Current State and Product
        const updatedState = { ...currentState, ...(aiResponse.updated_fields || {}) };

        await query(
            `UPDATE marketplace.listing_assistant_sessions 
             SET current_state_json = @state, updated_at = SYSDATETIME() 
             WHERE id = @sessionId`,
            [
                { name: 'sessionId', value: session_id, type: sql.UniqueIdentifier },
                { name: 'state', value: JSON.stringify(updatedState), type: sql.NVarChar }
            ]
        );

        // Sync to Product table for preview / persistence
        if (aiResponse.updated_fields) {
            const { title, description, price, category, condition } = aiResponse.updated_fields;
            let productUpdate = "UPDATE marketplace.Products SET updated_at = SYSDATETIME()";
            const updateParams: any[] = [{ name: 'productId', value: assistantSession.product_id, type: sql.UniqueIdentifier }];

            if (title) { productUpdate += ", title = @title"; updateParams.push({ name: 'title', value: title, type: sql.NVarChar }); }
            if (description) { productUpdate += ", description = @description"; updateParams.push({ name: 'description', value: description, type: sql.NVarChar }); }
            if (price) { productUpdate += ", price = @price"; updateParams.push({ name: 'price', value: parseFloat(price), type: sql.Decimal(18, 2) }); }
            if (category) { productUpdate += ", category = @category"; updateParams.push({ name: 'category', value: category, type: sql.NVarChar }); }
            if (condition) { productUpdate += ", condition = @condition"; updateParams.push({ name: 'condition', value: condition, type: sql.NVarChar }); }

            productUpdate += " WHERE id = @productId";
            if (updateParams.length > 1) {
                await query(productUpdate, updateParams);
            }
        }

        // 5. Save next question
        if (aiResponse.next_question) {
            await query(
                `INSERT INTO marketplace.listing_assistant_questions (session_id, question_key, question_text, suggestions_json) 
                 VALUES (@sessionId, @key, @text, @suggestions)`,
                [
                    { name: 'sessionId', value: session_id, type: sql.UniqueIdentifier },
                    { name: 'key', value: aiResponse.next_question.question_key, type: sql.NVarChar },
                    { name: 'text', value: aiResponse.next_question.question_text, type: sql.NVarChar },
                    { name: 'suggestions', value: JSON.stringify(aiResponse.next_question.suggestions || []), type: sql.NVarChar }
                ]
            );
        }

        return NextResponse.json({
            updated_state: updatedState,
            next_question: aiResponse.next_question,
            is_complete: aiResponse.progress?.required_complete,
            message: aiResponse.feedback
        });

    } catch (error) {
        console.error('Seller Chat Answer API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
