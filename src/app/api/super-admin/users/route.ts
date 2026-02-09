
import { NextRequest } from 'next/server';
import { adminHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { getPool, sql } from '@/lib/db';

export async function GET(req: NextRequest) {
    return adminHandler(req, async () => {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role');
        const status = searchParams.get('status'); // active, disabled

        const offset = (page - 1) * limit;

        const pool = await getPool();
        const request = pool.request();

        // Fix: Use dbo schema and PascalCase columns
        // u.Id, u.Email, u.FullName...
        // Join with Roles
        let query = `
            SELECT u.Id, u.Email, u.FullName, u.CreatedAt,
                   (SELECT STRING_AGG(r.Name, ',') FROM dbo.UserRoles ur JOIN dbo.Roles r ON ur.RoleId = r.Id WHERE ur.UserId = u.Id) as roles
            FROM dbo.Users u
            WHERE 1=1
        `;

        if (search) {
            query += ` AND (u.Email LIKE @search OR u.FullName LIKE @search)`;
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        if (role) {
            query += ` AND EXISTS (SELECT 1 FROM dbo.UserRoles ur JOIN dbo.Roles r ON ur.RoleId = r.Id WHERE ur.UserId = u.Id AND r.Name = @role)`;
            request.input('role', sql.NVarChar, role);
        }

        // Count total
        const countQueryText = query.replace(/SELECT .* FROM/s, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*/, '');
        // Regex replace is safer here to avoid matching exact string
        // Actually, just build a count query separately or use CTE.
        // For simplicity, let's just make a count query.

        let countQuery = `SELECT COUNT(*) as total FROM dbo.Users u WHERE 1=1`;
        if (search) countQuery += ` AND (u.Email LIKE @search OR u.FullName LIKE @search)`;
        if (role) countQuery += ` AND EXISTS (SELECT 1 FROM dbo.UserRoles ur JOIN dbo.Roles r ON ur.RoleId = r.Id WHERE ur.UserId = u.Id AND r.Name = @role)`;

        const countResult = await request.query(countQuery);
        const total = countResult.recordset[0].total;

        // Fetch data
        query += ` ORDER BY u.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        // Map PascalCase to standard JSON response
        const mappedUsers = result.recordset.map(u => ({
            id: u.Id,
            email: u.Email,
            full_name: u.FullName,
            created_at: u.CreatedAt,
            roles: u.roles ? u.roles.split(',') : []
        }));

        return successResponse(mappedUsers, {
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    });
}

// Create new user (Admin)
export async function POST(req: NextRequest) {
    return adminHandler(req, async () => {
        const body = await req.json();
        const { email, password, full_name, role } = body;

        if (!email || !password || !full_name) {
            return errorResponse('Missing required fields');
        }

        const pool = await getPool();
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = transaction.request();
            request.input('email', sql.NVarChar, email);
            request.input('full_name', sql.NVarChar, full_name);
            request.input('password_hash', sql.NVarChar, hashedPassword);

            // Fix: Insert into dbo.Users (Id is Identity, so don't insert)
            const userResult = await request.query(`
                INSERT INTO dbo.Users (Email, FullName, PasswordHash, CreatedAt)
                OUTPUT INSERTED.Id
                VALUES (@email, @full_name, @password_hash, SYSDATETIMEOFFSET())
            `);

            const newUserId = userResult.recordset[0].Id; // PascalCase

            if (role) {
                request.input('roleName', sql.NVarChar, role);
                const roleRes = await request.query(`SELECT Id FROM dbo.Roles WHERE Name = @roleName`);

                if (roleRes.recordset.length > 0) {
                    const roleId = roleRes.recordset[0].Id;

                    const insertRoleReq = transaction.request();
                    insertRoleReq.input('uid', sql.Int, newUserId); // INT
                    insertRoleReq.input('rid', sql.Int, roleId);
                    await insertRoleReq.query(`INSERT INTO dbo.UserRoles (UserId, RoleId) VALUES (@uid, @rid)`);
                }
            }

            await transaction.commit();
            return successResponse({ id: newUserId, email, full_name, role });

        } catch (err: any) {
            await transaction.rollback();
            if (err.number === 2627) return errorResponse('Email already exists');
            throw err;
        }
    });
}
