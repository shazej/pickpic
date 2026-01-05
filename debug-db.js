
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
    const queryStr = process.argv[2];
    if (!queryStr) {
        console.error('Please provide a query.');
        process.exit(1);
    }

    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(queryStr);
        console.log(JSON.stringify(result.recordset, null, 2));
        await pool.close();
    } catch (err) {
        console.error('Query failed:', err);
    }
}

run();
