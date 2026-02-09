
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

async function run() {
    try {
        const pool = await sql.connect(config);
        const productsResult = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'marketplace' AND TABLE_NAME = 'Products'");
        console.log('Columns in marketplace.Products table:', productsResult.recordset.map(r => r.COLUMN_NAME));

        const sellersResult = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'marketplace' AND TABLE_NAME = 'SellerProfiles'");
        console.log('Columns in marketplace.SellerProfiles table:', sellersResult.recordset.map(r => r.COLUMN_NAME));

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
