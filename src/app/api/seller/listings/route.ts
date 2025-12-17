
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// List Listings
export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Seller ID
        const sellerResult = await query('SELECT id FROM marketplace.SellerProfiles WHERE user_id = @userId', [
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }
        ]);

        if (sellerResult.recordset.length === 0) {
            return NextResponse.json({ listings: [] });
        }
        const sellerId = sellerResult.recordset[0].id;

        const listingsResult = await query(`
            SELECT p.*, 
            (SELECT TOP 1 image_url FROM marketplace.ProductImages WHERE product_id = p.id AND is_primary = 1) as image_url
            FROM marketplace.Products p
            WHERE p.seller_id = @sellerId
            ORDER BY p.updated_at DESC
        `, [{ name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier }]);

        return NextResponse.json({ listings: listingsResult.recordset });

    } catch (error) {
        console.error('Seller Listings API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Create Listing
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Seller ID
        const sellerResult = await query('SELECT id FROM marketplace.SellerProfiles WHERE user_id = @userId', [
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }
        ]);

        if (sellerResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Seller profile required' }, { status: 403 });
        }
        const sellerId = sellerResult.recordset[0].id;

        const { title, description, category, price, condition, status, images, attributes } = await request.json();

        // 1. Insert Product
        // Use OUTPUT INSERTED.id to get the new ID
        const productResult = await query(`
            INSERT INTO marketplace.Products (seller_id, title, description, category, price, condition, status)
            OUTPUT INSERTED.id
            VALUES (@sellerId, @title, @description, @category, @price, @condition, @status)
        `, [
            { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier },
            { name: 'title', value: title, type: sql.NVarChar },
            { name: 'description', value: description, type: sql.NVarChar },
            { name: 'category', value: category, type: sql.NVarChar },
            { name: 'price', value: parseFloat(price), type: sql.Decimal(18, 2) },
            { name: 'condition', value: condition, type: sql.NVarChar },
            { name: 'status', value: status || 'draft', type: sql.NVarChar } // 'draft' or 'published'
        ]);

        const productId = productResult.recordset[0].id;

        // 2. Insert Images
        if (images && images.length > 0) {
            // In a loop for simplicity, or use TVP/JSON if performance critical
            for (const img of images) {
                await query(`
                    INSERT INTO marketplace.ProductImages (product_id, image_url, is_primary)
                    VALUES (@productId, @url, @isPrimary)
                 `, [
                    { name: 'productId', value: productId, type: sql.UniqueIdentifier },
                    { name: 'url', value: img.url, type: sql.NVarChar },
                    { name: 'isPrimary', value: img.isPrimary ? 1 : 0, type: sql.Bit }
                ]);
            }
        }

        // 3. Insert Attributes
        if (attributes) {
            const attrJson = JSON.stringify(attributes);
            await query(`
                INSERT INTO marketplace.ProductAttributes (product_id, attributes_json)
                VALUES (@productId, @json)
             `, [
                { name: 'productId', value: productId, type: sql.UniqueIdentifier },
                { name: 'json', value: attrJson, type: sql.NVarChar }
            ]);
        }

        return NextResponse.json({ id: productId, message: 'Listing created' }, { status: 201 });

    } catch (error) {
        console.error('Create Listing API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
