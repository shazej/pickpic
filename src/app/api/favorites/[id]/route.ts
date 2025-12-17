
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        await query(`
            IF NOT EXISTS (SELECT 1 FROM marketplace.Favorites WHERE user_id = @userId AND product_id = @productId)
            BEGIN
                INSERT INTO marketplace.Favorites (user_id, product_id) VALUES (@userId, @productId)
            END
        `, [
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'productId', value: id, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ message: 'Added to favorites' });

    } catch (error) {
        console.error('Favorites API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        await query(`
            DELETE FROM marketplace.Favorites WHERE user_id = @userId AND product_id = @productId
        `, [
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'productId', value: id, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ message: 'Removed from favorites' });

    } catch (error) {
        console.error('Favorites API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        // If no session, return false (not favorited)
        if (!session || !session.user) {
            return NextResponse.json({ isFavorited: false });
        }

        const { id } = await context.params;

        const result = await query(`
            SELECT 1 FROM marketplace.Favorites WHERE user_id = @userId AND product_id = @productId
        `, [
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'productId', value: id, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ isFavorited: result.recordset.length > 0 });

    } catch (error) {
        return NextResponse.json({ isFavorited: false });
    }
}
