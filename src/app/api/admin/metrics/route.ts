import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !(session.user as any)?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Parallel queries for speed
        // Note: Using multiple queries for simplicity. Could specific stored proc later.

        const usersPromise = query('SELECT COUNT(*) as count FROM auth.Users');
        const listingsPromise = query("SELECT COUNT(*) as count FROM marketplace.Products WHERE status = 'published'");
        const pendingReportsPromise = query("SELECT COUNT(*) as count FROM moderation.reports WHERE status = 'PENDING'");
        const pendingSellersPromise = query("SELECT COUNT(*) as count FROM marketplace.SellerProfiles WHERE approval_status = 'PENDING'");
        // Total Sold
        const soldPromise = query("SELECT COUNT(*) as count FROM marketplace.Products WHERE status = 'sold'");

        const [usersRes, listingsRes, reportsRes, soldRes, sellersRes] = await Promise.all([
            usersPromise,
            listingsPromise,
            pendingReportsPromise,
            soldPromise,
            pendingSellersPromise
        ]);

        return NextResponse.json({
            stats: {
                totalUsers: usersRes.recordset[0].count,
                activeListings: listingsRes.recordset[0].count,
                pendingReports: reportsRes.recordset[0].count,
                itemsSold: soldRes.recordset[0].count,
                pendingSellers: sellersRes.recordset[0].count
            }
        });

    } catch (error) {
        console.error('Admin metrics error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
