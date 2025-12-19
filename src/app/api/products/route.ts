
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

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

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, price, image } = body;

        if (!title || !price || !image) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get or Create Seller Profile
        let sellerId: string;
        const sellerQuery = `SELECT id FROM marketplace.SellerProfiles WHERE user_id = @userId`;
        const sellerResult = await query(sellerQuery, [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);

        if (sellerResult.recordset.length > 0) {
            sellerId = sellerResult.recordset[0].id;
        } else {
            // Auto-create seller profile for now
            const createSellerQuery = `
                INSERT INTO marketplace.SellerProfiles (user_id, store_name)
                OUTPUT INSERTED.id
                VALUES (@userId, @storeName)
            `;
            const createSellerResult = await query(createSellerQuery, [
                { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
                { name: 'storeName', value: session.user.name || 'My Store', type: sql.NVarChar }
            ]);
            sellerId = createSellerResult.recordset[0].id;
        }

        // 2. Insert Product
        const insertProductQuery = `
            INSERT INTO marketplace.Products (seller_id, title, description, price, status)
            OUTPUT INSERTED.id
            VALUES (@sellerId, @title, @description, @price, 'published')
        `;

        const productResult = await query(insertProductQuery, [
            { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier },
            { name: 'title', value: title, type: sql.NVarChar },
            { name: 'description', value: description, type: sql.NVarChar },
            { name: 'price', value: parseFloat(price), type: sql.Decimal(18, 2) }
        ]);

        const productId = productResult.recordset[0].id;

        // 3. Insert Image
        const insertImageQuery = `
            INSERT INTO marketplace.ProductImages (product_id, image_url, is_primary)
            VALUES (@productId, @imageUrl, 1)
        `;

        await query(insertImageQuery, [
            { name: 'productId', value: productId, type: sql.UniqueIdentifier },
            { name: 'imageUrl', value: image, type: sql.NVarChar }
        ]);

        return NextResponse.json({ success: true, productId });

    } catch (error) {
        console.error('Create Product Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
