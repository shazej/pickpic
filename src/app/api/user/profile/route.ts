import { auth } from "@/auth";
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export const GET = auth(async (req) => {
    try {
        const session = req.auth;
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await query('SELECT id, email, display_name FROM auth.Users WHERE id = @userId', [
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }
        ]);

        if (userResult.recordset.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: userResult.recordset[0] });

    } catch (error) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});

export const PATCH = auth(async (req) => {
    try {
        const session = req.auth;
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        await query('UPDATE auth.Users SET display_name = @name WHERE id = @userId', [
            { name: 'name', value: name, type: sql.NVarChar },
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }
        ]);

        return NextResponse.json({ message: 'Profile updated' });

    } catch (error) {
        console.error('Profile Update API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});
