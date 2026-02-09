
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

async function inspect() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT s.name as schema_name, t.name as table_name 
            FROM sys.tables t 
            JOIN sys.schemas s ON t.schema_id = s.schema_id
            ORDER BY s.name, t.name
        `);
        console.table(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
    }
}

inspect();
