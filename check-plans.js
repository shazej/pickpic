
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
        trustServerCertificate: true,
    }
};

async function checkPlans() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query(`
            SELECT * FROM billing.Plans
        `);
        console.log('Plans:', res.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
    }
}

checkPlans();
