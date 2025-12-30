
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { getPool, sql } from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from 'uuid';

// Helper: Save file to disk (simple local storage for MVP)
async function saveFileLocally(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    return `/uploads/${filename}`;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;
        const price = formData.get("price") as string;
        const description = formData.get("description") as string;
        const category = formData.get("category") as string || "General";

        if (!file || !price || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const pool = await getPool();

        // Get a default seller (or create one)
        const sellerConfig = await pool.request().query("SELECT TOP 1 id FROM marketplace.SellerProfiles");
        let sellerId = sellerConfig.recordset[0]?.id;

        if (!sellerId) {
            sellerId = '00000000-0000-0000-0000-000000000000';
        }

        // 1. Save Image
        let imageUrl = "";
        try {
            imageUrl = await saveFileLocally(file);
        } catch (e) {
            console.error("File save failed, ensure public/uploads exists", e);
            return NextResponse.json({ error: "File upload failed" }, { status: 500 });
        }

        // 2. Create Product (Draft/Published)
        const productId = uuidv4();

        await pool.request()
            .input('id', sql.UniqueIdentifier, productId)
            .input('seller_id', sql.UniqueIdentifier, sellerId)
            .input('title', sql.NVarChar, description.substring(0, 50) + (description.length > 50 ? "..." : ""))
            .input('description', sql.NVarChar, description)
            .input('category', sql.NVarChar, category)
            .input('price', sql.Decimal(18, 2), parseFloat(price))
            .input('status', sql.NVarChar, 'published')
            .query(`
            INSERT INTO marketplace.Products (id, seller_id, title, description, category, price, status)
            VALUES (@id, @seller_id, @title, @description, @category, @price, @status)
        `);

        // 3. Create ProductImage
        const imageId = uuidv4();
        await pool.request()
            .input('id', sql.UniqueIdentifier, imageId)
            .input('product_id', sql.UniqueIdentifier, productId)
            .input('image_url', sql.NVarChar, imageUrl)
            .query(`
            INSERT INTO marketplace.ProductImages (id, product_id, image_url, is_primary)
            VALUES (@id, @product_id, @image_url, 1)
        `);

        // 4. Generate AI Description & Embedding
        let aiDescription = "AI description disabled.";
        try {
            const { GoogleGenerativeAI } = await import("@google/generative-ai");
            const apiKey = process.env.GOOGLE_GENAI_API_KEY;

            if (apiKey) {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const base64Image = buffer.toString('base64');

                const prompt = "Describe this product in detail for a marketplace listing. Include title, price estimate (number only), and a short appealing description. Return JSON format: { title: string, price: number, description: string }.";
                const imagePart = {
                    inlineData: {
                        data: base64Image,
                        mimeType: file.type
                    }
                };

                const result = await model.generateContent([prompt, imagePart]);
                aiDescription = result.response.text();

                // Embed it
                const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
                const embedResult = await embedModel.embedContent(aiDescription);
                const embedding = embedResult.embedding.values;
                const embeddingJson = JSON.stringify(embedding);

                // 5. Save Embedding
                await pool.request()
                    .input('image_id', sql.UniqueIdentifier, imageId)
                    .input('model', sql.NVarChar, 'text-embedding-004')
                    .input('vector', sql.NVarChar, embeddingJson)
                    .query(`
                    INSERT INTO ai.ImageEmbeddings (product_image_id, model_name, embedding_json)
                    VALUES (@image_id, @model, @vector)
                `);
            }
        } catch (e) {
            console.error("AI Step Failed", e);
            aiDescription = "AI Generated content failed involved.";
        }

        return NextResponse.json({
            success: true,
            productId,
            aiDescription
        });

    } catch (error) {
        console.error("List API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" + error }, { status: 500 });
    }
}
