import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession } from './auth';
import { getPool, sql } from './db';

export type ActionResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
    meta?: any;
    code?: string; // Standardized error code
};

/**
 * Logs an action to the audit.events table.
 * @param actorId - The ID of the user performing the action (from session)
 * @param action - Action name (e.g., 'USER_UPDATE', 'LISTING_APPROVE')
 * @param entityType - Target entity type (e.g., 'USER', 'LISTING')
 * @param entityId - Target entity ID
 * @param details - Optional JSON object or string with details
 * @param ipAddress - Optional IP address
 */
export async function auditLog(
    actorId: string | number,
    action: string,
    entityType: string,
    entityId: string | number,
    details?: any,
    ipAddress?: string
) {
    try {
        const pool = await getPool();
        const request = pool.request();

        request.input('actorId', actorId);
        request.input('action', sql.VarChar(100), action);
        request.input('entityType', sql.VarChar(50), entityType);
        // EntityId can be int or string, store as string
        request.input('entityId', sql.VarChar(100), String(entityId));
        request.input('details', sql.NVarChar(sql.MAX), typeof details === 'object' ? JSON.stringify(details) : details);
        request.input('ipAddress', sql.VarChar(45), ipAddress || null);

        // Try inserting into audit.events (from superadmin_schema.sql)
        // Check if audit schema exists in production_schema.sql or if we need to valid existence
        // We assume the table exists as per requirements "based on existing database schema"
        await request.query(`
            INSERT INTO audit.events (actor_id, action, entity_type, entity_id, details, ip_address, created_at)
            VALUES (@actorId, @action, @entityType, @entityId, @details, @ipAddress, SYSDATETIME())
        `);
    } catch (error) {
        console.error('Audit Log Failed:', error);
        // Do not crash the main request if audit fails, but log it critically
    }
}

export async function adminHandler(
    req: Request,
    handler: (session: any) => Promise<NextResponse>
) {
    try {
        const session = await getSession();

        // Check if user is super_admin
        // Note: Production schema uses 'auth.UserRoles'
        if (!session || !session.user || !session.user.roles || !session.user.roles.includes('super_admin')) {
            // For strict RBAC, unauthenticated = 401, unauthorized = 403
            if (!session || !session.user) {
                return NextResponse.json(
                    { success: false, error: 'Unauthenticated', code: 'UNAUTHENTICATED' },
                    { status: 401 }
                );
            }
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Super Admin access required', code: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        return await handler(session);
    } catch (error: any) {
        console.error('API Error:', error);

        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation Error',
                    errors: error.flatten().fieldErrors,
                    code: 'VALIDATION_ERROR'
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Internal Server Error',
                code: 'INTERNAL_ERROR',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export function successResponse(data: any, meta?: any) {
    return NextResponse.json({ success: true, data, meta });
}

export function errorResponse(message: string, status = 400, code = 'BAD_REQUEST', details?: any) {
    return NextResponse.json({ success: false, error: message, code, details }, { status });
}
