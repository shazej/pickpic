
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, sql } from '@/lib/db';

async function checkAdmin() {
    const session = await getSession();
    if (!session || !session.user) return false;

    const roleRes = await query('SELECT r.name FROM auth.UserRoles ur JOIN auth.Roles r ON ur.role_id = r.id WHERE ur.user_id = @id', [
        { name: 'id', value: session.user.id, type: sql.UniqueIdentifier }
    ]);

    return roleRes.recordset.some(r => r.name === 'admin');
}

export async function GET() {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await query('SELECT * FROM billing.country_pricing ORDER BY country_name ASC');
        return NextResponse.json({ countries: result.recordset });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch country pricing' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { country_code, country_name, ppp_multiplier, currency_code, rounding_rule } = await request.json();

        await query(`
            INSERT INTO billing.country_pricing (country_code, country_name, ppp_multiplier, currency_code, rounding_rule)
            VALUES (@code, @name, @multiplier, @currency, @round)
        `, [
            { name: 'code', value: country_code.toUpperCase(), type: sql.Char(2) },
            { name: 'name', value: country_name, type: sql.NVarChar(100) },
            { name: 'multiplier', value: ppp_multiplier, type: sql.Decimal(5, 2) },
            { name: 'currency', value: currency_code.toUpperCase(), type: sql.Char(3) },
            { name: 'round', value: rounding_rule, type: sql.NVarChar(20) }
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create country pricing' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, country_name, ppp_multiplier, currency_code, rounding_rule, is_active } = await request.json();

        await query(`
            UPDATE billing.country_pricing 
            SET country_name = @name,
                ppp_multiplier = @multiplier,
                currency_code = @currency,
                rounding_rule = @round,
                is_active = @active,
                updated_at = SYSDATETIME()
            WHERE id = @id
        `, [
            { name: 'id', value: id, type: sql.UniqueIdentifier },
            { name: 'name', value: country_name, type: sql.NVarChar(100) },
            { name: 'multiplier', value: ppp_multiplier, type: sql.Decimal(5, 2) },
            { name: 'currency', value: currency_code.toUpperCase(), type: sql.Char(3) },
            { name: 'round', value: rounding_rule, type: sql.NVarChar(20) },
            { name: 'active', value: is_active ? 1 : 0, type: sql.Bit }
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update country pricing' }, { status: 500 });
    }
}
