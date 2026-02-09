const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1434'),
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'marketplace' AND table_name = 'ProductImages'");
        console.log(JSON.stringify(res.recordset, null, 2));
        await pool.close();
    } catch (e) {
        console.error(e);
    }
}

check();
