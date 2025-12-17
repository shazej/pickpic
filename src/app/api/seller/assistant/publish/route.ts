import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { session_id } = await req.json();
        const pool = await getPool();

        // Get Session
        const sessionResult = await pool.request()
            .input('id', sql.UniqueIdentifier, session_id)
            .query('SELECT context_data, seller_user_id FROM listing_assistant_sessions WHERE id = @id');

        if (sessionResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const session = sessionResult.recordset[0];
        const state = JSON.parse(session.context_data);

        // Validation (Basic)
        if (!state.title || !state.category || !state.condition) {
            return NextResponse.json({ error: 'Listing incomplete' }, { status: 400 });
        }

        // Insert Product
        const productId = (await pool.request().query('SELECT NEWID() as id')).recordset[0].id;

        await pool.request()
            .input('id', sql.UniqueIdentifier, productId)
            .input('seller_id', sql.UniqueIdentifier, session.seller_user_id)
            .input('title', sql.NVarChar, state.title)
            .input('description', sql.NVarChar(sql.MAX), state.description || '')
            .input('price', sql.Decimal(10, 2), state.price || 0)
            .input('currency', sql.NVarChar, state.currency || 'USD')
            .input('category_id', sql.UniqueIdentifier, '00000000-0000-0000-0000-000000000000') // Placeholder/Lookup needed
            .input('condition', sql.NVarChar, state.condition)
            .query(`
                INSERT INTO products (id, seller_id, title, description, price, currency, category_id, condition, status, created_at)
                VALUES (@id, @seller_id, @title, @description, @price, @currency, @category_id, @condition, 'active', SYSDATETIMEOFFSET())
            `);

        // Insert Images (assuming state.images has URLs)
        if (state.images && state.images.length > 0) {
            for (let i = 0; i < state.images.length; i++) {
                await pool.request()
                    .input('product_id', sql.UniqueIdentifier, productId)
                    .input('image_url', sql.NVarChar(2048), state.images[i])
                    .input('is_primary', sql.Bit, i === 0 ? 1 : 0)
                    .query(`
                        INSERT INTO product_images (product_id, image_url, is_primary)
                        VALUES (@product_id, @image_url, @is_primary)
                    `);
            }
        }

        return NextResponse.json({ product_id: productId, status: 'published' });

    } catch (error: any) {
        console.error('Publish error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
