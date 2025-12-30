
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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
        console.log('Connecting...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const sqlPath = path.join(__dirname, 'seed-automotive.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing Automotive Seed...');
        await pool.request().query(sqlContent);
        console.log('Seed executed successfully.');

        pool.close();
    } catch (err) {
        console.error('Error executing seed:', err);
    }
}

run();
