"use server";

import { query, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-checks";
import { revalidatePath } from "next/cache";

export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export async function getSellers(status: SellerStatus = 'PENDING') {
    await requireAdmin();

    const result = await query(
        `SELECT 
            sp.id, 
            sp.user_id, 
            sp.store_name, 
            sp.status, 
            sp.created_at, 
            u.email, 
            u.display_name as user_name
         FROM marketplace.SellerProfiles sp
         JOIN auth.Users u ON sp.user_id = u.id
         WHERE sp.status = @status
         ORDER BY sp.created_at DESC`,
        [{ name: 'status', value: status, type: sql.NVarChar }]
    );

    return result.recordset;
}

export async function updateSellerStatus(sellerId: string, status: SellerStatus, rejectReason?: string) {
    const admin = await requireAdmin();

    try {
        await query(
            `UPDATE marketplace.SellerProfiles 
             SET status = @status, 
                 reject_reason = @reason,
                 reviewed_by = @adminId,
                 reviewed_at = SYSDATETIME()
             WHERE id = @id`,
            [
                { name: 'status', value: status, type: sql.NVarChar },
                { name: 'reason', value: rejectReason || null, type: sql.NVarChar },
                { name: 'adminId', value: admin.id, type: sql.UniqueIdentifier },
                { name: 'id', value: sellerId, type: sql.UniqueIdentifier }
            ]
        );

        // Mock Email Notification
        console.log(`[MockEmail] Sending email to seller ${sellerId}: Status changed to ${status}. Reason: ${rejectReason || 'N/A'}`);

        revalidatePath('/admin/sellers');
        return { success: true };
    } catch (e) {
        console.error("Failed to update seller status", e);
        return { success: false, error: "Database error" };
    }
}
