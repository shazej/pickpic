
import { NextRequest } from 'next/server';
import { adminHandler, successResponse } from '@/lib/api-utils';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
    return adminHandler(req, async () => {
        const pool = await getPool();
        const request = pool.request();

        // Parallel queries for dashboard stats
        const usersQuery = `
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN created_at >= DATEADD(day, -7, GETDATE()) THEN 1 ELSE 0 END) as new_users_7d,
                SUM(CASE WHEN created_at >= DATEADD(day, -30, GETDATE()) THEN 1 ELSE 0 END) as new_users_30d
            FROM users
        `;

        const sellersQuery = `
            SELECT 
                COUNT(*) as total_sellers,
                SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending_sellers
            FROM sellers
        `;

        const listingsQuery = `
            SELECT 
                COUNT(*) as total_listings,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_listings
            FROM products
        `;

        const [usersRes, sellersRes, listingsRes] = await Promise.all([
            request.query(usersQuery),
            request.query(sellersQuery),
            request.query(listingsQuery)
        ]);

        return successResponse({
            users: usersRes.recordset[0],
            sellers: sellersRes.recordset[0],
            listings: listingsRes.recordset[0],
            // Mocking others until tables exist in dev env
            revenue: { total: 0, growth: 0 },
            support: { open: 0, urgent: 0 }
        });
    });
}
