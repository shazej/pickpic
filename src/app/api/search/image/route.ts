
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { getPool } from "@/lib/db";
import { cosineSimilarity } from "@/lib/vector-store";

// Helper to convert file to base64
async function fileToBase64(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    return buffer.toString("base64");
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // 1. Describe the image using Google Generative AI SDK
        const b64Image = await fileToBase64(file);

        let description = "";
        let queryVector: number[] = [];

        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const apiKey = process.env.GOOGLE_GENAI_API_KEY;

            if (apiKey) {
                const genAI = new GoogleGenerativeAI(apiKey);

                // Vision Model for Description
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const prompt = "Describe this product in detail for a marketplace search. Focus on visual attributes like color, material, shape, style, and category. Keep it dense and keyword-rich.";
                const imagePart = {
                    inlineData: {
                        data: b64Image,
                        mimeType: file.type
                    }
                };

                const result = await model.generateContent([prompt, imagePart]);
                description = result.response.text();

                // Embedding Model for Vector
                const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                const embedResult = await embedModel.embedContent(description);
                queryVector = embedResult.embedding.values;
            }
        } catch (e: any) {
            console.error("AI Generation Error", e);
            // Fallback if AI fails handled below by checking vector length
        }

        if (queryVector.length === 0) {
            // Mock fallback
            description = "Mock description for testing (AI config missing or failed)";
            queryVector = Array(768).fill(0).map(() => Math.random());
        }

        console.log("Generated Description:", description);

        // 3. Fetch all potential candidates from MSSQL
        const pool = await getPool();

        // Join Products, Images, and Embeddings
        const result = await pool.request().query(`
      SELECT 
        p.id, p.title, p.price, p.currency, p.category, p.description,
        pi.image_url,
        ie.embedding_json
      FROM marketplace.Products p
      JOIN marketplace.ProductImages pi ON p.id = pi.product_id AND pi.is_primary = 1
      JOIN ai.ImageEmbeddings ie ON pi.id = ie.product_image_id
      WHERE p.status = 'published'
    `);

        const candidates = result.recordset.map(row => {
            let vector: number[] = [];
            try {
                vector = JSON.parse(row.embedding_json);
            } catch (e) {
                console.error("Failed to parse vector for product", row.id);
            }
            return {
                ...row,
                vector
            };
        }).filter(c => c.vector.length > 0);

        // 4. Perform Vector Search (Cosine Similarity)
        const scored = candidates.map(c => ({
            product: {
                id: c.id,
                title: c.title,
                price: c.price,
                currency: c.currency,
                category: c.category,
                primary_image_url: c.image_url,
                match_reason: "Visual match"
            },
            score: cosineSimilarity(queryVector, c.vector)
        }));

        // Sort by score desc
        scored.sort((a, b) => b.score - a.score);

        // Top 20
        const topResults = scored.slice(0, 20);

        return NextResponse.json({
            results: topResults,
            debug_description: description
        });

    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
