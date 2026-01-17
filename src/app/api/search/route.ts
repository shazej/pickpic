
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        let sqlQuery = `
            SELECT p.*, 
            (SELECT TOP 1 image_url FROM marketplace.ProductImages WHERE product_id = p.id AND is_primary = 1) as image_url,
            sp.store_name as seller_name,
            sp.contact_info as seller_contact
            FROM marketplace.Products p
            JOIN marketplace.SellerProfiles sp ON p.seller_id = sp.id
            WHERE p.status = 'ACTIVE'
        `;

        const params: any[] = [];

        if (q) {
            sqlQuery += ` AND (p.title LIKE @q OR p.description LIKE @q OR p.category LIKE @q)`;
            params.push({ name: 'q', value: `%${q}%`, type: sql.NVarChar });
        }

        sqlQuery += ` ORDER BY p.created_at DESC OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;
        params.push({ name: 'limit', value: limit, type: sql.Int });

        const result = await query(sqlQuery, params);

        const products = result.recordset.map((row: any) => ({
            id: row.id,
            title: row.title,
            price: row.price,
            currency: row.currency,
            location: row.location_text,
            imageUrl: row.image_url,
            condition: row.condition,
            sellerName: row.seller_name,
            sellerContact: row.seller_contact ? JSON.parse(row.seller_contact) : undefined
        }));

        return NextResponse.json({ results: products });

    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
