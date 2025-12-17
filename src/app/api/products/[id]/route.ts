
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        // Fetch Product & Seller
        const productResult = await query(`
            SELECT 
                p.*,
                sp.store_name,
                sp.location_precision,
                sp.user_id as seller_user_id
            FROM marketplace.Products p
            JOIN marketplace.SellerProfiles sp ON p.seller_id = sp.id
            WHERE p.id = @id
        `, [{ name: 'id', value: id, type: sql.UniqueIdentifier }]);

        if (productResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const product = productResult.recordset[0];

        // Fetch Images
        const imagesResult = await query(`
            SELECT id, image_url, is_primary, width, height
            FROM marketplace.ProductImages
            WHERE product_id = @id
            ORDER BY is_primary DESC
        `, [{ name: 'id', value: id, type: sql.UniqueIdentifier }]);

        // Fetch Attributes
        const attrsResult = await query(`
            SELECT attributes_json
            FROM marketplace.ProductAttributes
            WHERE product_id = @id
        `, [{ name: 'id', value: id, type: sql.UniqueIdentifier }]);

        const attributes = attrsResult.recordset.length > 0
            ? JSON.parse(attrsResult.recordset[0].attributes_json)
            : {};

        return NextResponse.json({
            product: {
                ...product,
                images: imagesResult.recordset,
                attributes
            }
        });

    } catch (error) {
        console.error('Product Detail API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
