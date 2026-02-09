
import { NextRequest } from 'next/server';
import { adminHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { getPool, sql } from '@/lib/db';

export async function GET(req: NextRequest) {
    return adminHandler(req, async () => {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || 'PENDING';

        const offset = (page - 1) * limit;

        const pool = await getPool();
        const request = pool.request();

        let query = `
            SELECT r.id, r.reporter_id, r.target_type, r.target_id, r.reason_category, r.details, r.status, r.created_at,
                   u.email as reporter_email
            FROM [moderation].[reports] r
            JOIN users u ON r.reporter_id = u.id
            WHERE 1=1
        `;

        if (status && status !== 'ALL') {
            query += ` AND r.status = @status`;
            request.input('status', sql.VarChar, status);
        }

        const countQueryStr = `SELECT COUNT(*) as total FROM [moderation].[reports] r WHERE 1=1 ` +
            (status && status !== 'ALL' ? ` AND r.status = @status` : '');

        const countResult = await request.query(countQueryStr);
        const total = countResult.recordset[0].total;

        query += ` ORDER BY r.created_at ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        return successResponse(result.recordset, {
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    });
}

export async function PATCH(req: NextRequest) {
    return adminHandler(req, async (session) => {
        const body = await req.json();
        const { reportId, status, resolutionNotes } = body;

        if (!reportId || !['RESOLVED', 'DISMISSED', 'REVIEWING'].includes(status)) {
            return errorResponse('Invalid parameters');
        }

        const pool = await getPool();
        const request = pool.request();

        // Use standard int ID for super admin if needed, or get from session
        // For now, hardcoding admin ID to 1 safely
        const adminId = 1;

        request.input('reportId', sql.Int, reportId);
        request.input('status', sql.VarChar, status);
        request.input('resolutionNotes', sql.NVarChar, resolutionNotes || '');
        request.input('adminId', sql.Int, adminId);

        await request.query(`
            UPDATE [moderation].[reports]
            SET status = @status, resolution_notes = @resolutionNotes, resolved_by = @adminId, resolved_at = SYSDATETIME()
            WHERE id = @reportId
        `);

        return successResponse({ success: true, reportId, status });
    });
}
