
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await query(`
            SELECT * FROM marketplace.SellerProfiles WHERE user_id = @userId
        `, [{ name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }]);

        if (result.recordset.length === 0) {
            return NextResponse.json({ profile: null });
        }

        return NextResponse.json({ profile: result.recordset[0] });

    } catch (error) {
        console.error('Seller Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storeName, bio, location, contactInfo } = await request.json();
        const contactJson = contactInfo ? JSON.stringify(contactInfo) : null;

        // Upsert Profile
        // Note: Using MERGE or basic IF/ELSE
        await query(`
            MERGE marketplace.SellerProfiles AS target
            USING (SELECT @userId AS user_id) AS source
            ON (target.user_id = source.user_id)
            WHEN MATCHED THEN
                UPDATE SET 
                    store_name = @storeName,
                    bio = @bio,
                    location_precision = @location,
                    contact_info = ISNULL(@contactInfo, contact_info),
                    updated_at = SYSDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (user_id, store_name, bio, location_precision, contact_info, approval_status)
                VALUES (@userId, @storeName, @bio, @location, @contactInfo, 'PENDING');
        `, [
            { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
            { name: 'storeName', value: storeName, type: sql.NVarChar },
            { name: 'bio', value: bio || '', type: sql.NVarChar },
            { name: 'location', value: location || '', type: sql.NVarChar },
            { name: 'contactInfo', value: contactJson, type: sql.NVarChar }
        ]);

        // Ensure Seller Role
        const roleResult = await query("SELECT id FROM auth.Roles WHERE name = 'seller'");
        if (roleResult.recordset.length > 0) {
            const roleId = roleResult.recordset[0].id;
            await query(`
                IF NOT EXISTS (SELECT 1 FROM auth.UserRoles WHERE user_id = @userId AND role_id = @roleId)
                BEGIN
                    INSERT INTO auth.UserRoles (user_id, role_id) VALUES (@userId, @roleId)
                END
            `, [
                { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
                { name: 'roleId', value: roleId, type: sql.Int }
            ]);
        }

        return NextResponse.json({ message: 'Profile updated' });

    } catch (error) {
        console.error('Seller Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
