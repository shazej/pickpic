
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

        console.log('--- Check Constraints on marketplace.Products ---');
        const result = await pool.request().query(`
            SELECT cc.name AS constraint_name, cc.definition
            FROM sys.check_constraints cc
            JOIN sys.objects o ON cc.parent_object_id = o.object_id
            WHERE o.object_id = OBJECT_ID('marketplace.Products')
        `);
        console.log(result.recordset);

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
