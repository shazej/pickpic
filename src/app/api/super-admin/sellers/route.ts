
import { NextRequest } from 'next/server';
import { adminHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { getPool, sql } from '@/lib/db';

export async function GET(req: NextRequest) {
    return adminHandler(req, async () => {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status'); // all, approved, pending

        const offset = (page - 1) * limit;

        const pool = await getPool();
        const request = pool.request();

        let query = `
            SELECT s.user_id, s.business_name, s.rating, s.is_approved, s.created_at,
                   u.email, u.full_name
            FROM sellers s
            JOIN users u ON s.user_id = u.id
            WHERE 1=1
        `;

        if (search) {
            query += ` AND (s.business_name LIKE @search OR u.email LIKE @search OR u.full_name LIKE @search)`;
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        if (status === 'approved') {
            query += ` AND s.is_approved = 1`;
        } else if (status === 'pending') {
            query += ` AND s.is_approved = 0`;
        }

        // Count
        const countQueryStr = `SELECT COUNT(*) as total FROM sellers s JOIN users u ON s.user_id = u.id WHERE 1=1 ` +
            (search ? ` AND (s.business_name LIKE @search OR u.email LIKE @search)` : '') +
            (status === 'approved' ? ` AND s.is_approved = 1` : (status === 'pending' ? ` AND s.is_approved = 0` : ''));

        const countResult = await request.query(countQueryStr);
        const total = countResult.recordset[0].total;

        // Fetch
        query += ` ORDER BY s.created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        return successResponse(result.recordset, {
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    });
}

// Action: Approve/Suspend Seller
export async function PATCH(req: NextRequest) {
    return adminHandler(req, async () => {
        const body = await req.json();
        const { sellerId, action } = body; // action: 'approve', 'suspend'

        if (!sellerId || !['approve', 'suspend'].includes(action)) {
            return errorResponse('Invalid parameters');
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('sellerId', sql.UniqueIdentifier, sellerId);

        if (action === 'approve') {
            await request.query(`UPDATE sellers SET is_approved = 1 WHERE user_id = @sellerId`);
        } else {
            // Suspend - sets to 0
            await request.query(`UPDATE sellers SET is_approved = 0 WHERE user_id = @sellerId`);
            // Also unpublish listings? Optional policy choice.
        }

        return successResponse({ success: true, action });
    });
}
