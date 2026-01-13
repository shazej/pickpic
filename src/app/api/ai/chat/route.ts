
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AiService } from '@/services/ai-service';
import { isRateLimited } from '@/lib/rate-limiter';

export async function POST(request: Request) {
    try {
        let session;
        try {
            session = await getSession();
        } catch (authError) {
            console.error("[AI] Session retrieval failed:", authError);
            // Non-blocking for anon chat
        }

        const userId = session?.user?.id || null;

        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error("[AI] Request parsing failed:", e);
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { message, history, image } = body;

        // 1. SEARCH DATABASE FOR RELEVANT PRODUCTS (Kept identical)
        let productsContext = "No specific products found for this query.";

        try {
            const searchKeywords = message.split(' ').filter((w: string) => w.length > 2);
            if (searchKeywords.length > 0) {
                const queryText = `
                    SELECT TOP 5 p.id, p.title, p.price, p.currency, p.description,
                    u.display_name as seller_name, u.phone as seller_phone,
                    (SELECT TOP 1 image_url FROM marketplace.ProductImages WHERE product_id = p.id AND is_primary = 1) as image_url
                    FROM marketplace.Products p
                    LEFT JOIN marketplace.SellerProfiles sp ON p.seller_id = sp.id
                    LEFT JOIN auth.Users u ON sp.user_id = u.id
                    WHERE p.status = 'published' AND (${searchKeywords.map((_: any, i: number) => `p.title LIKE @k${i} OR p.description LIKE @k${i}`).join(' OR ')})
                `;
                const params = searchKeywords.map((w: string, i: number) => ({ name: `k${i}`, value: `%${w}%`, type: sql.NVarChar }));
                const dbResult = await query(queryText, params);

                if (dbResult.recordset.length > 0) {
                    productsContext = "Found the following products in the marketplace:\n" +
                        dbResult.recordset.map((p: any) => `- ${p.title} (ID: ${p.id}): ${p.description || ''} - Price: ${p.price} ${p.currency} - Seller: ${p.seller_name} (${p.seller_phone || 'No phone'})`).join('\n');
                }
            }
        } catch (dbError) {
            console.error("[AI] Product search failed:", dbError);
        }

        const prompt = `
            You are kechiki AI, a premium conversational assistant.
            You help users find products, sell items, or just chat.
            
            Context: The user is in a unified chat interface.
            Marketplace Search Results:
            ${productsContext}

            History: ${JSON.stringify(history || [])}
            User Message: ${message}
            
            If the user wants to SELL: guide them to provide details.
            If the user is looking for something and you found matches above:
             - Mention the products by name.
             - Provide helpful info about them.
             - Use ONLY the product IDs and details provided above.
             - Return the products in the "matched_products" field.
            
            Return a JSON response with:
            {
                "reply": "your message",
                "suggestions": ["next question?", "show me more"],
                "action": "none" | "list_item" | "search_items",
                "matched_products": [ { "product_id": "string", "reason": "why", "title": "string", "price": number, "currency": "string", "image_url": "string", "seller_name": "string", "seller_phone": "string" } ]
            }
        `;

        // 2. USE AI SERVICE (logs tokens automatically)
        const messages: any[] = [{ role: 'user', content: prompt }];

        if (image) {
            // Handle multimodal if needed by AiEngine types, or append to content
            // For now, appending image data as part of user content if supported by engine
            // Note: AiService.chat expects ChatRequest which supports array content
            messages[0].content = [
                { text: prompt },
                { image_url: image } // Assuming base64 data URI
            ];
        }

        console.log("[AI] Calling AiService.chat...");
        const response = await AiService.chat({
            messages,
            responseFormat: 'json',
            temperature: 0.7
        }, userId, 'global_assistant');

        // Parse JSON from response
        const data = response.json || JSON.parse(response.text);

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Unified Chat Error (Detailed):", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
