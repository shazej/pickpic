
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Check if user exists
        const checkResult = await query('SELECT id FROM users WHERE email = @email', [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);

        if (checkResult.recordset.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Remove Buffer logic, store as string in NVARCHAR

        // Insert user
        await query('INSERT INTO users (email, password_hash, full_name) VALUES (@email, @password, @name)', [
            { name: 'email', value: email, type: sql.NVarChar },
            { name: 'password', value: hashedPassword, type: sql.NVarChar }, // Changed to NVarChar
            { name: 'name', value: name || '', type: sql.NVarChar }
        ]);

        // Get user details
        const userResult = await query('SELECT id, email, full_name FROM users WHERE email = @email', [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);
        const user = userResult.recordset[0];

        // Assign 'buyer' role by default
        const roleResult = await query("SELECT id FROM roles WHERE name = 'buyer'");
        if (roleResult.recordset.length > 0) {
            const roleId = roleResult.recordset[0].id;
            await query('INSERT INTO user_roles (user_id, role_id) VALUES (@userId, @roleId)', [
                { name: 'userId', value: user.id, type: sql.UniqueIdentifier },
                { name: 'roleId', value: roleId, type: sql.Int }
            ]);
        }

        // Create Session
        await login({
            id: user.id,
            email: user.email,
            name: user.full_name,
            roles: ['buyer']
        });

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
