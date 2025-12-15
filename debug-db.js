
const sql = require('mssql');
require('dotenv').config();

const dbServer = process.env.DB_SERVER || 'WIN-LE7OOSFFT8H';
const [server, port] = dbServer.split(',');

console.log('Raw DB_SERVER:', process.env.DB_SERVER);
console.log('Parsed Server:', server);
console.log('Parsed Port:', port);

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: server,
    port: port ? parseInt(port) : undefined,
    database: 'master',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

console.log('Config Server:', config.server);
console.log('Config Port:', config.port);
console.log('Config User:', config.user);

async function run() {
    try {
        console.log('Connecting...');
        const pool = await sql.connect(config);
        console.log('Connected!');
        await pool.close();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

run();
