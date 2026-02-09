const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
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
