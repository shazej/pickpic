
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, sql } from '@/lib/db';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const result = await query(`
            SELECT s.*, p.name as plan_name, p.listings_limit, p.ai_scans_limit
            FROM billing.Subscriptions s
            JOIN billing.Plans p ON s.plan_id = p.id
            WHERE s.user_id = @userId
        `, [
            { name: 'userId', value: userId, type: sql.UniqueIdentifier }
        ]);

        if (result.recordset.length === 0) {
            // Default to Free if no record
            const freePlan = await query('SELECT * FROM billing.Plans WHERE amount = 0');
            return NextResponse.json({
                subscription: null,
                plan: freePlan.recordset[0] || { name: 'Starter', amount: 0, listings_limit: 5, ai_scans_limit: 50 }
            });
        }

        return NextResponse.json({
            subscription: result.recordset[0],
            plan: {
                name: result.recordset[0].plan_name,
                listings_limit: result.recordset[0].listings_limit,
                ai_scans_limit: result.recordset[0].ai_scans_limit,
                base_amount: result.recordset[0].base_amount,
                ppp_multiplier: result.recordset[0].ppp_multiplier,
                final_amount: result.recordset[0].final_amount,
                currency: result.recordset[0].currency
            }
        });

    } catch (error) {
        console.error('Subscription API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
