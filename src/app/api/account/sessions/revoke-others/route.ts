import { auth } from "@/auth";
import { query, sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const POST = auth(async (req) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = req.auth.user.id;

        // Auth.js sessions are typically stored in cookies. 
        // In database strategy, they are also in the database.
        // We can get the current session token from the cookie or the request.

        const cookieStore = await cookies();
        // The default session cookie name for next-auth is 'authjs.session-token' or similar.
        // In local/dev it might be 'next-auth.session-token'.
        // We need to find the session token of the CURRENT request to avoid revoking it.

        const sessionToken = cookieStore.get("authjs.session-token")?.value ||
            cookieStore.get("__Secure-authjs.session-token")?.value ||
            cookieStore.get("next-auth.session-token")?.value;

        if (!sessionToken) {
            return NextResponse.json({ error: "Current session not found" }, { status: 400 });
        }

        await query(`
            DELETE FROM auth.sessions 
            WHERE user_id = @userId AND session_token != @sessionToken
        `, [
            { name: "userId", value: userId, type: sql.UniqueIdentifier },
            { name: "sessionToken", value: sessionToken, type: sql.NVarChar }
        ]);

        return NextResponse.json({ message: "Other sessions revoked successfully" });
    } catch (error) {
        console.error("Revoke Sessions API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
