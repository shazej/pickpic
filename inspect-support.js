
const sql = require('mssql');
const config = {
    user: 'sa',
    password: 'V3r!fy#92uM@xTq1zR71',
    server: 'static.193.212.55.162.clients.your-server.de',
    port: 1434,
    database: 'PICKPIC',
    options: { encrypt: true, trustServerCertificate: true }
};

async function inspectSchema() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'support' AND TABLE_NAME = 'tickets'
        `);
        console.table(result.recordset);
        pool.close();
    } catch (err) { console.error(err); }
}
inspectSchema();
