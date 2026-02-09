import { auth } from "@/auth";
import { query, sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const POST = auth(async (req) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider) {
        return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    const userId = req.auth.user.id;

    try {
        // 1. Check if user has other login methods
        const providersResult = await query(`
            SELECT provider FROM auth.oauth_accounts WHERE user_id = @userId
        `, [{ name: "userId", value: userId, type: sql.UniqueIdentifier }]);

        const userResult = await query(`
            SELECT password_hash FROM auth.Users WHERE id = @userId
        `, [{ name: "userId", value: userId, type: sql.UniqueIdentifier }]);

        const hasPassword = userResult.recordset[0]?.password_hash !== null;
        const otherProviders = providersResult.recordset.filter(p => p.provider !== provider);

        if (!hasPassword && otherProviders.length === 0) {
            return NextResponse.json({
                error: "Cannot unlink the only login method. Set a password or link another account first."
            }, { status: 400 });
        }

        // 2. Unlink
        await query(`
            DELETE FROM auth.oauth_accounts WHERE user_id = @userId AND provider = @provider
        `, [
            { name: "userId", value: userId, type: sql.UniqueIdentifier },
            { name: "provider", value: provider, type: sql.NVarChar }
        ]);

        // 3. Log event
        await query(`
            INSERT INTO audit.events (actor_id, action, entity_type, entity_id, details)
            VALUES (@userId, 'UNLINK_ACCOUNT', 'OAUTH_ACCOUNT', @provider, @details)
        `, [
            { name: "userId", value: userId, type: sql.UniqueIdentifier },
            { name: "provider", value: provider, type: sql.NVarChar },
            { name: "details", value: `Unlinked ${provider} account`, type: sql.NVarChar }
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to unlink account:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
