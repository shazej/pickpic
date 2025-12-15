
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Fetch user
        const result = await query('SELECT * FROM Users WHERE Email = @email', [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);

        const user = result.recordset[0];

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.PasswordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // In a real app, you'd set a session cookie or return a JWT here.
        // For this task, we'll return user info to the context.
        return NextResponse.json({
            user: {
                id: user.Id,
                email: user.Email,
                name: user.FullName
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
