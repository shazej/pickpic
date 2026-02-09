"use server";

import { query, sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-checks";
import { revalidatePath } from "next/cache";

export type FlagStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export async function getFlags(status: FlagStatus = 'OPEN') {
    await requireAdmin();

    const result = await query(
        `SELECT 
            f.id, 
            f.target_type, 
            f.target_id, 
            f.reason, 
            f.created_at, 
            u.email as reporter_email,
            u.display_name as reporter_name
         FROM moderation.flags f
         LEFT JOIN auth.Users u ON f.reporter_id = u.id
         WHERE f.status = @status
         ORDER BY f.created_at DESC`,
        [{ name: 'status', value: status, type: sql.NVarChar }]
    );

    return result.recordset;
}

export async function updateFlagStatus(flagId: string, status: FlagStatus) {
    const admin = await requireAdmin();

    try {
        await query(
            `UPDATE moderation.flags
             SET status = @status,
                 resolved_by = @adminId,
                 resolved_at = SYSDATETIME(),
                 updated_at = SYSDATETIME()
             WHERE id = @id`,
            [
                { name: 'status', value: status, type: sql.NVarChar },
                { name: 'adminId', value: admin.id, type: sql.UniqueIdentifier },
                { name: 'id', value: flagId, type: sql.UniqueIdentifier }
            ]
        );

        revalidatePath('/admin/moderation/messages');
        return { success: true };
    } catch (e) {
        console.error("Failed to update flag status", e);
        return { success: false, error: "Database error" };
    }
}
