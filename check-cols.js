
const sql = require('mssql');
require('dotenv').config({ path: '.env.production' });

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD, // Loaded correctly now
    server: process.env.DB_SERVER || 'static.193.212.55.162.clients.your-server.de',
    port: parseInt(process.env.DB_PORT || '1434'),
    database: process.env.DB_NAME || 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

async function checkColumns() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'billing' AND TABLE_NAME = 'Subscriptions'
        `);
        console.log('Columns:', res.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
    }
}

checkColumns();
