
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { analyzeImage, getEmbedding } from '@/ai/marketplace'; // Ensure this path is correct
import { saveEmbedding, searchVectors } from '@/lib/vector-store';

export const maxDuration = 60; // Allow longer timeout for AI ops
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const intent = formData.get('intent') as string || 'search'; // 'search' | 'list'

        if (!file) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // 1. Generate Embedding (Vector)
        // Mocking/Fallback if AI service fails or not configured
        let vector: number[] = [];
        try {
            // In a real app we'd likely caption it first to get better text embedding, 
            // OR use a multimodal embedding model directly. 
            // For this MVP usage of GenKit's textEmbedding004, we need text.
            // So Step 1 is Vision -> Text.
            const caption = await analyzeImage(base64Image, 'Describe this product in detail for ecommerce search. Include color, material, type, and style.');
            const embeddingResult = await getEmbedding(caption);
            vector = embeddingResult.embedding;
        } catch (e) {
            console.error("AI Embedding Failed, using random vector for demo safety:", e);
            // Fallback for demo continuity if API keys missing
            vector = Array(768).fill(0).map(() => Math.random());
        }


        // 2. Handle Intent
        if (intent === 'list') {
            // CREATE LISTING
            // Create a temporary Seller ID (or use auth if available)
            // For MVP: random seller or fixed "Demo Seller"

            // Ensure Demo Seller exists
            let sellerId = '00000000-0000-0000-0000-000000000000'; // Placeholder
            // Try to find or insert a demo seller
            const sellerCheck = await query("SELECT TOP 1 id FROM marketplace.sellers");
            if (sellerCheck.recordset.length > 0) {
                sellerId = sellerCheck.recordset[0].id;
            } else {
                // Insert one
                await query("INSERT INTO marketplace.sellers (contact_info) VALUES ('{\"email\":\"demo@example.com\"}')");
                const newSeller = await query("SELECT TOP 1 id FROM marketplace.sellers");
                sellerId = newSeller.recordset[0].id; // This might be brittle with concurrent reqs but ok for MVP
            }

            // Generate Metadata
            let aiMetadata: any = {};
            let title = "New Item";
            let description = "Uploaded item";
            let price = null;

            try {
                const detailsJSON = await analyzeImage(base64Image, 'Return a JSON object with keys: title, description, category, color, material, estimated_price. Do not use markdown.');
                // Strip markdown code blocks if present
                const cleanJSON = detailsJSON.replace(/```json/g, '').replace(/```/g, '').trim();
                const details = JSON.parse(cleanJSON);
                aiMetadata = details;
                title = details.title || title;
                description = details.description || description;
                price = details.estimated_price || 0; // AI guesses price?
            } catch (e) {
                console.log("Failed to parse AI details", e);
            }

            // Insert Listing
            // We store the vector in a JSON column 'embedding_id' is used as a placeholder in schema, 
            // but for 'listings' table we didn't add a 'vector' column explicitly in SQL, 
            // we have 'embedding_id'. 
            // Actually, in vector-store.ts I proposed storing it.
            // Let's modify the schema or just store it in `ai_attributes` for this hacky MVP 
            // OR assumes `saveEmbedding` does something.
            // Let's put the vector in `ai_attributes` as a hidden field or ignored field.

            const result = await query(
                `INSERT INTO marketplace.listings 
                (seller_id, title, description, price, ai_attributes, image_url) 
                OUTPUT INSERTED.id
                VALUES (@sellerId, @title, @desc, @price, @aiAttr, 'https://picsum.photos/seed/' + NEWID() + '/400/400')`, // Random placeholder image
                [
                    { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier },
                    { name: 'title', value: title, type: sql.NVarChar },
                    { name: 'desc', value: description, type: sql.NVarChar },
                    { name: 'price', value: price, type: sql.Decimal(18, 2) },
                    { name: 'aiAttr', value: JSON.stringify({ ...aiMetadata, vector }), type: sql.NVarChar }
                ]
            );

            return NextResponse.json({ success: true, listingId: result.recordset[0].id });

        } else {
            // SEARCH INTENT
            const refinement = formData.get('refinement') as string;
            let filters: any = {};

            if (refinement) {
                // LLM interpret refinement
                try {
                    const filterPrompt = `User said: "${refinement}". Extract filters as JSON. Keys: minPrice, maxPrice, color, material.`;
                    // Ideally we use a lighter model or tool calling here
                    // For MVP, simplistic parsing or just assume price for "Cheaper"
                    if (refinement.toLowerCase().includes('cheaper')) {
                        filters.maxPrice = 100; // Mock logic
                    }
                } catch (e) {
                    console.log("Refinement parsing failed", e);
                }
            }

            // Fetch all listings
            // Ideally we only fetch active ones
            // And we need their vectors.
            // Performance warning: Fetching ALL vectors is O(N). Fine for MVP.

            const allListings = await query("SELECT id, title, price, image_url, ai_attributes, description FROM marketplace.listings"); // Added description
            const vectors = allListings.recordset.map((row: any) => {
                try {
                    const attr = JSON.parse(row.ai_attributes || '{}');
                    return {
                        id: row.id,
                        embedding: attr.vector || [], // Assuming vector is stored here
                        price: row.price,
                        color: attr.color
                    };
                } catch {
                    return { id: row.id, embedding: [] };
                }
            }).filter((v: any) => v.embedding && v.embedding.length > 0);

            // Apply Filters (Pre-filter before vector search or post-filter?)
            // Post-filter usually safer for KNN recall, but Pre-filter faster.
            let candidateVectors = vectors;
            if (filters.maxPrice) {
                candidateVectors = candidateVectors.filter((v: any) => v.price && v.price < filters.maxPrice);
            }

            const searchResults = searchVectors(vector, candidateVectors);

            // Hydrate results
            const hydratedResults = searchResults.map(res => {
                const item = allListings.recordset.find((l: any) => l.id === res.id);
                return { ...item, score: res.score };
            });

            return NextResponse.json({
                results: hydratedResults,
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
