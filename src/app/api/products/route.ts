
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Filters
        const q = searchParams.get('q');
        const category = searchParams.get('category');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const sort = searchParams.get('sort') || 'newest';

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Base Query
        let sqlQuery = `
            SELECT 
                p.id, p.title, p.price, p.currency, p.created_at, p.status,
                (SELECT TOP 1 image_url FROM marketplace.ProductImages WHERE product_id = p.id AND is_primary = 1) as image_url,
                sp.store_name as seller_name,
                sp.id as seller_id
            FROM marketplace.Products p
            JOIN marketplace.SellerProfiles sp ON p.seller_id = sp.id
            WHERE p.status = 'published'
        `;

        const params: any[] = [];

        // Dynamic Conditions
        if (q) {
            sqlQuery += ` AND (p.title LIKE @q OR p.description LIKE @q)`;
            params.push({ name: 'q', value: `%${q}%`, type: sql.NVarChar });
        }

        if (category) {
            sqlQuery += ` AND p.category = @category`;
            params.push({ name: 'category', value: category, type: sql.NVarChar });
        }

        if (minPrice) {
            sqlQuery += ` AND p.price >= @minPrice`;
            params.push({ name: 'minPrice', value: parseFloat(minPrice), type: sql.Decimal(18, 2) });
        }

        if (maxPrice) {
            sqlQuery += ` AND p.price <= @maxPrice`;
            params.push({ name: 'maxPrice', value: parseFloat(maxPrice), type: sql.Decimal(18, 2) });
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                sqlQuery += ` ORDER BY p.price ASC`;
                break;
            case 'price_desc':
                sqlQuery += ` ORDER BY p.price DESC`;
                break;
            case 'oldest':
                sqlQuery += ` ORDER BY p.created_at ASC`;
                break;
            case 'newest':
            default:
                sqlQuery += ` ORDER BY p.created_at DESC`;
                break;
        }

        // Pagination
        sqlQuery += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        params.push({ name: 'offset', value: offset, type: sql.Int });
        params.push({ name: 'limit', value: limit, type: sql.Int });

        // Count Query (Simplified for speed)
        // Note: For large datasets, use a separate count or window function
        const countQueryText = `SELECT COUNT(*) as total FROM marketplace.Products p WHERE p.status = 'published'`;
        // Note: Re-applying filters to count query would be ideal but kept simple for now

        const result = await query(sqlQuery, params);

        return NextResponse.json({
            products: result.recordset,
            page,
            limit
        });

    } catch (error) {
        console.error('Products API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
