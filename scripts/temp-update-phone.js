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

async function update() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("UPDATE auth.Users SET phone = '+965 5555 1234' WHERE phone IS NULL OR phone = ''");
        console.log(`Updated ${result.rowsAffected[0]} phone numbers`);
        await pool.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

update();
