
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AiService } from '@/services/ai-service';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        let { image_url } = body;

        if (!image_url) {
            return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
        }

        // Ensure absolute URL for AI service
        if (image_url.startsWith('/')) {
            const baseUrl = process.env.APP_BASE_URL || 'http://localhost:9002';
            image_url = `${baseUrl}${image_url}`;
        }

        // 1. Get/Create Seller Profile
        let sellerId: string;
        const sellerResult = await query(
            `SELECT id FROM marketplace.SellerProfiles WHERE user_id = @userId`,
            [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]
        );

        if (sellerResult.recordset.length > 0) {
            sellerId = sellerResult.recordset[0].id;
        } else {
            const createSeller = await query(
                `INSERT INTO marketplace.SellerProfiles (user_id, store_name) 
                 OUTPUT INSERTED.id VALUES (@userId, @storeName)`,
                [
                    { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
                    { name: 'storeName', value: session.user.name || 'My Store', type: sql.NVarChar }
                ]
            );
            sellerId = createSeller.recordset[0].id;
        }

        // 2. Create Draft Product
        const createProduct = await query(
            `INSERT INTO marketplace.Products (seller_id, title, price, status) 
             OUTPUT INSERTED.id VALUES (@sellerId, 'New Listing', 0, 'draft')`,
            [{ name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier }]
        );
        const productId = createProduct.recordset[0].id;

        // 3. Save Image
        await query(
            `INSERT INTO marketplace.ProductImages (product_id, image_url, is_primary) 
             VALUES (@productId, @imageUrl, 1)`,
            [
                { name: 'productId', value: productId, type: sql.UniqueIdentifier },
                { name: 'imageUrl', value: image_url, type: sql.NVarChar }
            ]
        );

        const draftState = {
            title: 'New Listing',
            price: 0,
            currency: 'USD',
            images: [image_url],
            attributes: {}
        };

        // 4. Create Session
        const createSession = await query(
            `INSERT INTO marketplace.listing_assistant_sessions (seller_id, product_id, current_state_json) 
             OUTPUT INSERTED.id VALUES (@sellerId, @productId, @state)`,
            [
                { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier },
                { name: 'productId', value: productId, type: sql.UniqueIdentifier },
                { name: 'state', value: JSON.stringify(draftState), type: sql.NVarChar }
            ]
        );
        const sessionId = createSession.recordset[0].id;

        // 5. Generate Initial Question
        const aiResponse = await AiService.getSellerChatResponse({
            draft: draftState,
            answer: "Initial analysis of the image.",
            sellerId: sellerId,
            imageUrl: image_url
        });

        if (!aiResponse) {
            throw new Error("Failed to get AI response");
        }

        // 6. Save first question
        const createQuestion = await query(
            `INSERT INTO marketplace.listing_assistant_questions (session_id, question_key, question_text, suggestions_json) 
             OUTPUT INSERTED.id VALUES (@sessionId, @key, @text, @suggestions)`,
            [
                { name: 'sessionId', value: sessionId, type: sql.UniqueIdentifier },
                { name: 'key', value: aiResponse.next_question?.question_key, type: sql.NVarChar },
                { name: 'text', value: aiResponse.next_question?.question_text, type: sql.NVarChar },
                { name: 'suggestions', value: JSON.stringify(aiResponse.next_question?.suggestions || []), type: sql.NVarChar }
            ]
        );

        return NextResponse.json({
            session_id: sessionId,
            current_state: draftState,
            question: aiResponse.next_question
        });

    } catch (error) {
        console.error('Seller Chat Session API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
