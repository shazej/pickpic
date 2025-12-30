
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
