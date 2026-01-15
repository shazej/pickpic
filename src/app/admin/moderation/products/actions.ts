"use server";

import { query, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-checks";
import { revalidatePath } from "next/cache";

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export async function getModerationQueue(status: ModerationStatus = 'PENDING') {
    await requireAdmin();

    const result = await query(
        `SELECT 
            p.id, 
            p.title, 
            p.created_at, 
            p.price,
            p.currency,
            p.moderation_status,
            s.store_name,
            (SELECT TOP 1 url FROM marketplace.ProductImages WHERE product_id = p.id) as image_url
         FROM marketplace.Products p
         JOIN marketplace.SellerProfiles s ON p.seller_id = s.id
         WHERE p.moderation_status = @status OR (@status = 'FLAGGED' AND p.flagged_count > 0)
         ORDER BY p.created_at ASC`,
        [{ name: 'status', value: status, type: sql.NVarChar }]
    );

    return result.recordset;
}

export async function updateProductModeration(productId: string, status: ModerationStatus) {
    const admin = await requireAdmin();

    try {
        await query(
            `UPDATE marketplace.Products 
             SET moderation_status = @status,
                 updated_at = SYSDATETIME()
             WHERE id = @id`,
            [
                { name: 'status', value: status, type: sql.NVarChar },
                { name: 'id', value: productId, type: sql.UniqueIdentifier }
            ]
        );

        revalidatePath('/admin/moderation/products');
        return { success: true };
    } catch (e) {
        console.error("Failed to update product moderation", e);
        return { success: false, error: "Database error" };
    }
}
