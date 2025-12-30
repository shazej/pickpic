
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

        console.log('--- Checking users (dbo) ---');
        const r1 = await pool.request().query("SELECT * FROM users WHERE Email = 'admin@pickpic.com' OR Email LIKE 'admin%'");
        console.log(r1.recordset);

        console.log('--- Checking auth.Users ---');
        const r2 = await pool.request().query("SELECT * FROM auth.Users WHERE email = 'admin@pickpic.com'");
        console.log(r2.recordset);

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
