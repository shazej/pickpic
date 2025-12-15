
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Check if user exists
        const checkResult = await query('SELECT Id FROM Users WHERE Email = @email', [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);

        if (checkResult.recordset.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        await query('INSERT INTO Users (Email, PasswordHash, FullName) VALUES (@email, @password, @name)', [
            { name: 'email', value: email, type: sql.NVarChar },
            { name: 'password', value: hashedPassword, type: sql.NVarChar },
            { name: 'name', value: name || '', type: sql.NVarChar }
        ]);

        return NextResponse.json({ message: 'User created successfully' }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
