
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Get Listings Count
        // First check if user is a seller
        const sellerResult = await query('SELECT id FROM marketplace.SellerProfiles WHERE user_id = @userId', [
            { name: 'userId', value: userId, type: sql.UniqueIdentifier }
        ]);

        let listingsCount = 0;
        if (sellerResult.recordset.length > 0) {
            const sellerId = sellerResult.recordset[0].id;
            const countRes = await query('SELECT COUNT(*) as count FROM marketplace.Products WHERE seller_id = @sellerId', [
                { name: 'sellerId', value: sellerId, type: sql.UniqueIdentifier }
            ]);
            listingsCount = countRes.recordset[0].count;
        }

        // 2. Get AI Usage Count (buyer_chat, seller_chat)
        // Note: feature_name in AI service logs are 'buyer_chat' and 'seller_chat'
        const usageRes = await query(`
            SELECT feature_name, COUNT(*) as count 
            FROM billing.usage_events 
            WHERE user_id = @userId 
            GROUP BY feature_name
        `, [{ name: 'userId', value: userId, type: sql.UniqueIdentifier }]);

        const usageMap: Record<string, number> = {};
        usageRes.recordset.forEach(row => {
            usageMap[row.feature_name] = row.count;
        });

        return NextResponse.json({
            usage: {
                listings: listingsCount,
                aiScans: (usageMap['buyer_chat'] || 0) + (usageMap['seller_chat'] || 0),
                raw: usageMap
            }
        });

    } catch (error) {
        console.error('Usage API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
