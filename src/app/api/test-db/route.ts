
import { NextResponse } from 'next/server';
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'V3r!fy#92uM@xTq1zR71',
    server: 'static.193.212.55.162.clients.your-server.de',
    port: 1434,
    database: 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

export async function GET() {
    try {
        console.log('Test DB Route: Connecting...');
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT 1 as result');
        await pool.close();
        return NextResponse.json({ success: true, result: result.recordset[0] });
    } catch (err: any) {
        console.error('Test DB Route Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
