
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { aiEngine } from '@/ai/engine/service';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const settingsRes = await query("SELECT key_name, value, updated_at FROM settings.system_config WHERE key_name IN ('active_ai_provider', 'active_ai_model', 'ollama_base_url')");
        const settings = settingsRes.recordset.reduce((acc: any, row: any) => {
            acc[row.key_name] = row.value;
            acc.updatedAt = row.updated_at; // Takes the last one
            return acc;
        }, {});

        return NextResponse.json({
            provider: settings.active_ai_provider,
            model: settings.active_ai_model,
            ollamaBaseUrl: settings.ollama_base_url,
            updatedAt: settings.updatedAt
        });

    } catch (error) {
        console.error('Admin AI Provider GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user?.roles?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { provider, model, ollamaBaseUrl } = body;

        if (provider) {
            await query("UPDATE settings.system_config SET value = @val, updated_at = SYSDATETIME() WHERE key_name = 'active_ai_provider'",
                [{ name: 'val', value: provider, type: sql.NVarChar }]);
        }
        if (model) {
            await query("UPDATE settings.system_config SET value = @val, updated_at = SYSDATETIME() WHERE key_name = 'active_ai_model'",
                [{ name: 'val', value: model, type: sql.NVarChar }]);
        }
        if (ollamaBaseUrl) {
            await query("UPDATE settings.system_config SET value = @val, updated_at = SYSDATETIME() WHERE key_name = 'ollama_base_url'",
                [{ name: 'val', value: ollamaBaseUrl, type: sql.NVarChar }]);
        }

        // Clear engine cache to apply changes immediately
        aiEngine.clearCache();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin AI Provider PUT Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
