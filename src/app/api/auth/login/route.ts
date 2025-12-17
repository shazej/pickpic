
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Fetch User and Hash
        const userResult = await query(`
            SELECT u.id, u.email, u.display_name, u.password_hash 
            FROM auth.Users u
            WHERE u.email = @email AND u.is_active = 1
        `, [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);

        if (userResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = userResult.recordset[0];

        // Verify Password
        // Note: password_hash IS VARBINARY from DB. Buffer.from handles it.
        const isValid = await bcrypt.compare(password, user.password_hash.toString('utf8'));

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Fetch Roles
        const rolesResult = await query(`
            SELECT r.name 
            FROM auth.Roles r
            JOIN auth.UserRoles ur ON r.id = ur.role_id
            WHERE ur.user_id = @userId
        `, [
            { name: 'userId', value: user.id, type: sql.UniqueIdentifier }
        ]);

        const roles = rolesResult.recordset.map(r => r.name);

        // Create Session
        await login({
            id: user.id,
            email: user.email,
            name: user.display_name,
            roles: roles
        });

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.display_name,
                roles: roles
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
