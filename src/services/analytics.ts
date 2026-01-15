import { query, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-checks";

export interface AnalyticsStats {
    totalRevenue: number;
    activeSellers: number;
    pendingListings: number;
    activeFlags: number;
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
    // In production, we would query the DB.
    // For now, we return mocked data or simple counts where possible.

    // Attempt real counts where tables exist
    try {
        const admin = await requireAdmin(); // Ensure auth call doesn't block if cached or low overhead

        // Parallel queries
        const [sellersRes, listingsRes, flagsRes] = await Promise.all([
            query("SELECT COUNT(*) as count FROM marketplace.SellerProfiles WHERE status = 'APPROVED'"),
            query("SELECT COUNT(*) as count FROM marketplace.Products WHERE moderation_status = 'PENDING'"),
            query("SELECT COUNT(*) as count FROM moderation.flags WHERE status = 'OPEN'")
        ]);

        return {
            totalRevenue: 45231.89, // Mocked until Payments table exists/populated
            activeSellers: sellersRes.recordset[0]?.count || 0,
            pendingListings: listingsRes.recordset[0]?.count || 0,
            activeFlags: flagsRes.recordset[0]?.count || 0,
        };
    } catch (e) {
        console.error("Analytics fetch failed, using fallbacks", e);
        return {
            totalRevenue: 0,
            activeSellers: 0,
            pendingListings: 0,
            activeFlags: 0
        }
    }
}
