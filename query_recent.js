
const sql = require('mssql');
require('dotenv').config({ path: '.env.production' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);

        console.log('Checking recent products...');
        const count = await sql.query('SELECT COUNT(*) as c FROM marketplace.Products');
        const top = await sql.query('SELECT TOP 1 title, price, created_at FROM marketplace.Products ORDER BY created_at DESC');

        console.log(`Total Products: ${count.recordset[0].c}`);
        if (top.recordset.length > 0) {
            console.log(`Latest: ${top.recordset[0].title} ($${top.recordset[0].price}) - ${top.recordset[0].created_at}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
