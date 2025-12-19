
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
        // Fix: Use correct table 'dbo.Users' and PascalCase columns
        const userResult = await query(`
            SELECT u.Id, u.Email, u.FullName, u.PasswordHash 
            FROM dbo.Users u
            WHERE u.Email = @email
        `, [
            { name: 'email', value: email, type: sql.NVarChar }
        ]);

        if (userResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = userResult.recordset[0];

        // Verify Password
        // Fix: PasswordHash is NVARCHAR
        const isValid = await bcrypt.compare(password, user.PasswordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Fetch Roles
        // Fix: Use correct join tables dbo.Roles and dbo.UserRoles
        const rolesResult = await query(`
            SELECT r.Name 
            FROM dbo.Roles r
            JOIN dbo.UserRoles ur ON r.Id = ur.RoleId
            WHERE ur.UserId = @userId
        `, [
            // Fix: User Id is INT
            { name: 'userId', value: user.Id, type: sql.Int }
        ]);

        const roles = rolesResult.recordset.map(r => r.Name);

        // Create Session
        await login({
            id: user.Id,
            email: user.Email,
            name: user.FullName,
            roles: roles
        });

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.Id,
                email: user.Email,
                name: user.FullName,
                roles: roles
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
