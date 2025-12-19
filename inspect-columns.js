
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
        const result = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('users')");
        console.log('Columns in users table:', result.recordset.map(r => r.name));

        // Also check if auth.Users exists just in case
        const authResult = await pool.request().query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('auth.Users')");
        console.log('Columns in auth.Users table:', authResult.recordset.map(r => r.name));

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
