
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { cosineSimilarity } from '@/lib/vector-store';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Helper to mocked AI analysis
async function mockAnalyzeImage(base64: string, prompt: string) {
    if (prompt.includes("JSON")) {
        return JSON.stringify({
            title: "Vintage Denim Jacket",
            description: "A classic blue denim jacket with vintage wash.",
            category: "Outerwear",
            color: "Blue",
            material: "Denim",
            estimated_price: 45.00
        });
    }
    return "A blue denim jacket on a white background.";
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const intent = formData.get('intent') as string || 'search';
        const refinement = formData.get('refinement') as string;

        // 1. Generate Embedding (Vector)
        let vector: number[] = [];
        let caption = "";

        // Attempt Real AI
        try {
            if (file) {
                const { GoogleGenerativeAI } = await import("@google/generative-ai");
                const apiKey = process.env.GOOGLE_GENAI_API_KEY;

                if (apiKey) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const base64Image = buffer.toString('base64');

                    const prompt = "Describe this product for search indexing. Include category, color, material.";
                    const imagePart = {
                        inlineData: {
                            data: base64Image,
                            mimeType: file.type
                        }
                    };

                    const result = await model.generateContent([prompt, imagePart]);
                    caption = result.response.text();

                    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                    const embedResult = await embedModel.embedContent(caption);
                    vector = embedResult.embedding.values;
                }
            }
        } catch (e) {
            console.warn("AI Generation failed, using fallback", e);
        }

        // Fallback Vector (Random)
        if (vector.length === 0) {
            vector = Array(768).fill(0).map(() => Math.random());
            caption = "Mock description for " + (file ? file.name : "text query");
        }

        // 2. Handle Intent
        if (intent === 'list') {
            // CREATE LISTING
            let sellerId = '00000000-0000-0000-0000-000000000000';
            try {
                const sellerCheck = await query("SELECT TOP 1 id FROM marketplace.SellerProfiles");
                if (sellerCheck.recordset.length > 0) {
                    sellerId = sellerCheck.recordset[0].id;
                }
            } catch (e) { console.error("DB Seller Check Error", e); }

            let aiMetadata: any = {};
            let title = "New Item";
            let description = "Uploaded item";
            let price = 0;

            try {
                const detailsJSON = await mockAnalyzeImage("", "JSON");
                const details = JSON.parse(detailsJSON);
                aiMetadata = details;
                title = details.title;
                description = details.description;
                price = details.estimated_price;
            } catch (e) { }

            if (refinement) {
                description = refinement;
            }

            const result = await query(
                `INSERT INTO marketplace.Products 
                (seller_id, title, description, price, status, category) 
                OUTPUT INSERTED.id
                VALUES (@sellerId, @title, @desc, @price, 'published', @cat)`,
                [
                    { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier },
                    { name: 'title', value: title, type: sql.NVarChar },
                    { name: 'desc', value: description, type: sql.NVarChar },
                    { name: 'price', value: price, type: sql.Decimal(18, 2) },
                    { name: 'cat', value: aiMetadata.category || 'General', type: sql.NVarChar }
                ]
            );

            const productId = result.recordset[0].id;
            // Insert random picsum for UI
            await query(`INSERT INTO marketplace.ProductImages (product_id, image_url, is_primary) VALUES (@pid, @url, 1)`, [
                { name: 'pid', value: productId, type: sql.UniqueIdentifier },
                { name: 'url', value: `https://picsum.photos/seed/${productId}/400/400`, type: sql.NVarChar }
            ]);

            return NextResponse.json({ success: true, listingId: productId });

        } else {
            // SEARCH INTENT
            const allProducts = await query(`
                SELECT p.id, p.title, p.price, p.currency, pi.image_url 
                FROM marketplace.Products p
                LEFT JOIN marketplace.ProductImages pi ON p.id = pi.product_id AND pi.is_primary = 1
                WHERE p.status = 'published'
            `);

            const results = allProducts.recordset.map((p: any) => ({
                id: p.id,
                title: p.title,
                price: p.price,
                currency: p.currency || '$',
                image_url: p.image_url || 'https://via.placeholder.com/150',
                score: Math.random()
            }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5); // Top 5

            return NextResponse.json({
                results: results,
                meta: {
                    applied_refinement: refinement || null
                }
            });
        }

    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
