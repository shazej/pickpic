
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        // In a real vector search, we'd embed the image and query vector DB.
        // Here we will return random products from DB as "Visual Matches".

        const result = await query(`
            SELECT TOP 4 p.id, p.title, p.price, p.currency,
            (SELECT TOP 1 image_url FROM marketplace.ProductImages WHERE product_id = p.id AND is_primary = 1) as image_url
            FROM marketplace.Products p
            WHERE p.status = 'published'
            ORDER BY NEWID() -- Random for demo
        `);

        return NextResponse.json({
            results: result.recordset
        });

    } catch (error) {
        return NextResponse.json({ error: 'Search Error' }, { status: 500 });
    }
}
