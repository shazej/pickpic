
const sql = require('mssql');
require('dotenv').config({ path: '.env.production' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);

        console.log('--- Tables in Marketplace Schema ---');
        const tables = await sql.query("SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID('marketplace')");
        console.log(tables.recordset.map(t => t.name));

        console.log('\n--- Recent Audit Events ---');
        const audit = await sql.query('SELECT TOP 5 * FROM audit.events ORDER BY created_at DESC');
        console.log(audit.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
