const { sql } = require('./src/lib/db'); // This might fail if run with node
// Using pure JS approach again for safety
const mssql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    },
};

async function check() {
    try {
        await mssql.connect(config);
        const res = await mssql.query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'compliance'");
        if (res.recordset.length > 0) {
            console.log("Compliance schema exists. Tables found:", res.recordset.map(r => r.TABLE_NAME).join(', '));
        } else {
            console.log("Compliance schema NOT found.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Check failed:", e);
        process.exit(1);
    }
}
check();
