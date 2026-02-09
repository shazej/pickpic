
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
        const checkResult = await query('SELECT id FROM auth.Users WHERE email = @email', [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);

        if (checkResult.recordset.length > 0) {
            console.log('Registration error: User already exists:', email);
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }
        console.log('User check passed for:', email);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Remove Buffer logic, store as string in NVARCHAR

        // Insert user
        console.log('Inserting user into DB...');
        await query('INSERT INTO auth.Users (email, password_hash, display_name) VALUES (@email, @password, @name)', [
            { name: 'email', value: email, type: sql.NVarChar },
            { name: 'password', value: Buffer.from(hashedPassword) },
            { name: 'name', value: name || '', type: sql.NVarChar }
        ]);
        console.log('User inserted successfully');

        // Get user details
        const userResult = await query('SELECT id, email, display_name FROM auth.Users WHERE email = @email', [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);
        const user = userResult.recordset[0];

        // Assign 'buyer' and 'seller' roles by default for demo
        const rolesToAssign = ['buyer', 'seller'];
        console.log('Assigning roles:', rolesToAssign);
        for (const roleName of rolesToAssign) {
            const roleResult = await query("SELECT id FROM auth.Roles WHERE name = @roleName", [
                { name: 'roleName', value: roleName, type: sql.NVarChar }
            ]);
            if (roleResult.recordset.length > 0) {
                const roleId = roleResult.recordset[0].id;
                console.log(`Assigning role ${roleName} (ID: ${roleId}) to user ${user.id}`);
                await query('INSERT INTO auth.UserRoles (user_id, role_id) VALUES (@userId, @roleId)', [
                    { name: 'userId', value: user.id, type: sql.UniqueIdentifier },
                    { name: 'roleId', value: roleId, type: sql.Int }
                ]);
            } else {
                console.warn(`Role ${roleName} not found in database`);
            }
        }

        // Create Session - redundant as frontend calls login() after register
        /*
        await login({
            id: user.id,
            email: user.email,
            name: user.display_name,
            roles: rolesToAssign
        });
        */

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.display_name
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
