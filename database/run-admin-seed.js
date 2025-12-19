
const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

async function runSeed() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const schemaPath = path.join(__dirname, 'seed-admin-pascal.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing Admin Seed...');
        await pool.request().query(schemaSql);

        console.log('Admin Seed executed successfully.');
        pool.close();
    } catch (err) {
        console.error('Error executing seed:', err);
        process.exit(1);
    }
}

runSeed();
