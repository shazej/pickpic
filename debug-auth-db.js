
const sql = require('mssql');
require('dotenv').config({ path: '.env.production' });

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'V3r!fy#92uM@xTq1zR71',
    server: process.env.DB_SERVER || 'static.193.212.55.162.clients.your-server.de',
    port: parseInt(process.env.DB_PORT || '1434'),
    database: process.env.DB_NAME || 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

async function diagnose() {
    try {
        console.log('Connecting to MSSQL...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        // 1. Check current schema context
        const userRes = await pool.request().query("SELECT SCHEMA_NAME() AS default_schema, CURRENT_USER AS current_user_name");
        console.log('Context:', userRes.recordset[0]);

        // 2. Check USERS table name
        const tables = await pool.request().query(`
            SELECT s.name as schema_name, t.name as table_name 
            FROM sys.tables t 
            JOIN sys.schemas s ON t.schema_id = s.schema_id
            WHERE t.name = 'users' OR t.name = 'Users'
        `);
        console.log('Found User Tables:', tables.recordset);

        // 3. Check SUBSCRIPTIONS table
        const subTables = await pool.request().query(`
            SELECT s.name as schema_name, t.name as table_name 
            FROM sys.tables t 
            JOIN sys.schemas s ON t.schema_id = s.schema_id
            WHERE t.name = 'subscriptions'
        `);
        console.log('Found Subscription Tables:', subTables.recordset);

        // 4. Test Query used in Auth.ts
        // `SELECT status FROM subscriptions ...` implies default schema
        try {
            await pool.request().query("SELECT TOP 1 * FROM subscriptions");
            console.log('Query [SELECT * FROM subscriptions] SUCCESS');
        } catch (e) {
            console.error('Query [SELECT * FROM subscriptions] FAILED:', e.message);
        }

        // 5. Test Auth Query
        try {
            await pool.request().query("SELECT TOP 1 * FROM auth.Users");
            console.log('Query [SELECT * FROM auth.Users] SUCCESS');
        } catch (e) {
            console.error('Query [SELECT * FROM auth.Users] FAILED:', e.message);
        }

        pool.close();
    } catch (err) {
        console.error('Diagnosis Failed:', err);
    }
}

diagnose();
