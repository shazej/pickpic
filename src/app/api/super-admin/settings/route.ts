
import { NextRequest } from 'next/server';
import { adminHandler, successResponse } from '@/lib/api-utils';
import { getPool, sql } from '@/lib/db';

export async function GET(req: NextRequest) {
    return adminHandler(req, async () => {
        const pool = await getPool();
        const request = pool.request();

        // Fetch feature flags
        const flagsRes = await request.query(`SELECT key_name, is_enabled, description FROM [settings].[feature_flags]`);

        // Fetch system config (if exists, or mock)
        // const configRes = await request.query(`SELECT * FROM [settings].[system_config]`);

        return successResponse({
            featureFlags: flagsRes.recordset,
            // systemConfig: configRes.recordset
        });
    });
}

export async function POST(req: NextRequest) {
    return adminHandler(req, async (session) => {
        const body = await req.json();
        const { key_name, is_enabled } = body;

        const pool = await getPool();
        const request = pool.request();

        request.input('key', sql.VarChar, key_name);
        request.input('val', sql.Bit, is_enabled ? 1 : 0);
        // request.input('user', sql.Int, 1); // Audit user

        // Upsert
        await request.query(`
            MERGE [settings].[feature_flags] AS target
            USING (SELECT @key as key_name) AS source
            ON (target.key_name = source.key_name)
            WHEN MATCHED THEN
                UPDATE SET is_enabled = @val, updated_at = SYSDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (key_name, is_enabled) VALUES (@key, @val);
        `);

        return successResponse({ success: true, key_name, is_enabled });
    });
}
