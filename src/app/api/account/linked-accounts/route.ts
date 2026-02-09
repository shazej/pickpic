import { auth } from "@/auth";
import { query, sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = auth(async (req) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await query(`
            SELECT provider, created_at
            FROM auth.oauth_accounts
            WHERE user_id = @userId
        `, [
            { name: "userId", value: req.auth.user.id, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ accounts: result.recordset });
    } catch (error) {
        console.error("Failed to fetch linked accounts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
