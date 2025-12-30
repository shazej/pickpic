import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        constsession = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('q') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;

        // Count for pagination
        const countQuery = search
            ? "SELECT COUNT(*) as count FROM auth.Users WHERE email LIKE '%' + @search + '%' OR display_name LIKE '%' + @search + '%'"
            : "SELECT COUNT(*) as count FROM auth.Users";

        const countRes = await query(countQuery, search ? [{ name: 'search', value: search, type: sql.NVarChar }] : []);
        const total = countRes.recordset[0].count;

        // List Users
        let listQuery = `
            SELECT u.id, u.email, u.display_name, u.is_active, u.created_at,
                   STRING_AGG(r.name, ',') as roles
            FROM auth.Users u
            LEFT JOIN auth.UserRoles ur ON u.id = ur.user_id
            LEFT JOIN auth.Roles r ON ur.role_id = r.id
        `;

        if (search) {
            listQuery += " WHERE u.email LIKE '%' + @search + '%' OR u.display_name LIKE '%' + @search + '%'";
        }

        listQuery += `
            GROUP BY u.id, u.email, u.display_name, u.is_active, u.created_at
            ORDER BY u.created_at DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        const params = [
            { name: 'offset', value: offset, type: sql.Int },
            { name: 'limit', value: limit, type: sql.Int }
        ];
        if (search) params.push({ name: 'search', value: search, type: sql.NVarChar });

        const usersRes = await query(listQuery, params);

        return NextResponse.json({
            users: usersRes.recordset,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { userId, action } = await req.json(); // action: 'ban' | 'unban'

        if (!userId || !action) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

        if (action === 'ban' || action === 'unban') {
            const isActive = action === 'unban' ? 1 : 0;
            await query('UPDATE auth.Users SET is_active = @isActive WHERE id = @id', [
                { name: 'isActive', value: isActive, type: sql.Bit },
                { name: 'id', value: userId, type: sql.UniqueIdentifier }
            ]);

            // Audit Log (if using audit schema)
            await query(`
                INSERT INTO audit.events (actor_id, action, entity_type, entity_id, details)
                VALUES (@actorId, @action, 'user', @targetId, @details)
            `, [
                { name: 'actorId', value: session.user.id, type: sql.UniqueIdentifier },
                { name: 'action', value: action === 'ban' ? 'USER_BANNED' : 'USER_UNBANNED', type: sql.VarChar },
                { name: 'targetId', value: userId, type: sql.VarChar },
                { name: 'details', value: `Admin ${action} user`, type: sql.NVarChar }
            ]);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error) {
        console.error('Admin user update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
