
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'V3r!fy#92uM@xTq1zR71',
    server: 'static.193.212.55.162.clients.your-server.de',
    port: 14315,
    database: 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

async function run() {
    try {
        const pool = await sql.connect(config);

        console.log('--- Product Count ---');
        const count = await pool.request().query("SELECT COUNT(*) as total FROM marketplace.Products WHERE category='Automotive'");
        console.log(count.recordset[0]);

        console.log('--- Sample Product ---');
        const sample = await pool.request().query("SELECT TOP 1 title, price, status, condition FROM marketplace.Products WHERE category='Automotive'");
        console.log(sample.recordset[0]);

        console.log('--- Sample Attributes ---');
        // Join attributes if possible or just fetch one
        const attr = await pool.request().query("SELECT TOP 1 attributes_json FROM marketplace.ProductAttributes");
        console.log(attr.recordset[0]);

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
