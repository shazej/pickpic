import { auth } from "@/auth";
import { query, sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = auth(async (req) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = req.auth.user.id;
        const result = await query(`
            SELECT id, created_at, expires_at
            FROM auth.sessions
            WHERE user_id = @userId AND (revoked_at IS NULL OR revoked_at > SYSDATETIME())
        `, [
            { name: "userId", value: userId, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ sessions: result.recordset });
    } catch (error) {
        console.error("List Sessions API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
