import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { query, sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const POST = auth(async (req) => {
    if (!req.auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await req.json();

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        const userId = req.auth.user.id;

        // 1. Fetch current password hash
        const result = await query(`
            SELECT password_hash FROM auth.Users WHERE id = @userId
        `, [
            { name: "userId", value: userId, type: sql.UniqueIdentifier }
        ]);

        const user = result.recordset[0];
        let passwordHash = user.password_hash;
        if (Buffer.isBuffer(passwordHash)) {
            passwordHash = passwordHash.toString('utf-8');
        }

        // 2. If user has a password, verify current password
        if (passwordHash && passwordHash.length > 10) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required to set a new one" }, { status: 400 });
            }
            const isValid = await bcrypt.compare(currentPassword, passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
            }
        }

        // 3. Hash new password and update
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await query(`
            UPDATE auth.Users SET password_hash = @hash WHERE id = @userId
        `, [
            { name: "hash", value: hashedNewPassword, type: sql.NVarChar },
            { name: "userId", value: userId, type: sql.UniqueIdentifier }
        ]);

        // 4. Log event
        await query(`
            INSERT INTO audit.events (actor_id, action, entity_type, details)
            VALUES (@userId, 'CHANGE_PASSWORD', 'USER', 'Changed password successfully')
        `, [
            { name: "userId", value: userId, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Change Password API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
