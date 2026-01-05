
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AiService } from '@/services/ai-service';
import { isRateLimited } from '@/lib/rate-limiter';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        const userId = session?.user?.id || null;

        if (isRateLimited(`buyer_chat_${userId || 'anon'}`, 10, 60000)) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait a minute.' }, { status: 429 });
        }

        const body = await request.json();
        const { product_id, message, thread_id } = body;

        if (!product_id || !message) {
            return NextResponse.json({ error: 'Missing product_id or message' }, { status: 400 });
        }

        console.log('[DEBUG] Buyer Chat Request:', { product_id, message, thread_id });

        // 1. Fetch Product Details and Seller Location
        const productResult = await query(
            `SELECT p.*, pa.attributes_json, u.display_name as seller_name,
                    sp.location_lat, sp.location_lng
             FROM marketplace.Products p
             LEFT JOIN marketplace.ProductAttributes pa ON p.id = pa.product_id
             JOIN marketplace.SellerProfiles sp ON p.seller_id = sp.id
             JOIN auth.Users u ON sp.user_id = u.id
             WHERE p.id = @productId`,
            [{ name: 'productId', value: product_id, type: sql.UniqueIdentifier }]
        );

        if (productResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const product = productResult.recordset[0];
        console.log('[DEBUG] Product Found:', product.id);
        try {
            product.attributes = JSON.parse(product.attributes_json || '{}');
        } catch (e) {
            product.attributes = {};
        }

        // 2. Fetch Images Count
        const imagesResult = await query(
            `SELECT COUNT(*) as count FROM marketplace.ProductImages WHERE product_id = @productId`,
            [{ name: 'productId', value: product_id, type: sql.UniqueIdentifier }]
        );
        const imageCount = imagesResult.recordset[0].count;

        // 3. Handle Thread
        let finalThreadId = thread_id;
        let history: any[] = [];

        if (finalThreadId) {
            // Verify access (if owned by user)
            const threadCheck = await query(
                `SELECT * FROM ai.buyer_chat_threads WHERE id = @threadId`,
                [{ name: 'threadId', value: finalThreadId, type: sql.UniqueIdentifier }]
            );

            if (threadCheck.recordset.length > 0) {
                const thread = threadCheck.recordset[0];
                if (thread.user_id && thread.user_id !== userId) {
                    return NextResponse.json({ error: 'Unauthorized thread access' }, { status: 403 });
                }

                // Fetch history
                const historyResult = await query(
                    `SELECT role, content FROM ai.buyer_chat_messages 
                     WHERE thread_id = @threadId ORDER BY created_at ASC`,
                    [{ name: 'threadId', value: finalThreadId, type: sql.UniqueIdentifier }]
                );
                history = historyResult.recordset;
            } else {
                finalThreadId = null; // Thread ID provided doesn't exist, create new
            }
        }

        if (!finalThreadId) {
            const createThread = await query(
                `INSERT INTO ai.buyer_chat_threads (product_id, user_id) 
                 OUTPUT INSERTED.id VALUES (@productId, @userId)`,
                [
                    { name: 'productId', value: product_id, type: sql.UniqueIdentifier },
                    { name: 'userId', value: userId ? userId : null, type: sql.UniqueIdentifier }
                ]
            );
            finalThreadId = createThread.recordset[0].id;
        }

        // 4. Save User Message
        await query(
            `INSERT INTO ai.buyer_chat_messages (thread_id, role, content) 
             VALUES (@threadId, 'user', @content)`,
            [
                { name: 'threadId', value: finalThreadId, type: sql.UniqueIdentifier },
                { name: 'content', value: message, type: sql.NVarChar }
            ]
        );

        console.log('[DEBUG] Calling AI Service...');

        // 5. Get AI Response
        const sellerLocation = product.location_lat && product.location_lng
            ? `${product.location_lat}, ${product.location_lng}`
            : 'Location not specified';

        const aiResponse = await AiService.getBuyerChatResponse({
            product,
            message,
            history,
            imageCount,
            userId,
            sellerLocation: sellerLocation
        });

        if (!aiResponse) {
            throw new Error("Failed to get AI response");
        }

        // 6. Save AI Response
        await query(
            `INSERT INTO ai.buyer_chat_messages (thread_id, role, content, citations_json, suggested_questions_json) 
             VALUES (@threadId, 'assistant', @content, @citations, @suggestions)`,
            [
                { name: 'threadId', value: finalThreadId, type: sql.UniqueIdentifier },
                { name: 'content', value: aiResponse.reply, type: sql.NVarChar },
                { name: 'citations', value: JSON.stringify(aiResponse.citations), type: sql.NVarChar },
                { name: 'suggestions', value: JSON.stringify(aiResponse.suggested_questions), type: sql.NVarChar }
            ]
        );

        return NextResponse.json({
            thread_id: finalThreadId,
            ...aiResponse,
            metadata: { model: 'gemini-1.5-flash', latency_ms: 0 } // Latency should ideally be passed from AiService
        });

    } catch (error) {
        console.error('Buyer Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
