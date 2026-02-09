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

async function checkColumns() {
    try {
        await sql.connect(config);
        const result = await sql.query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND TABLE_SCHEMA = 'auth'");
        console.log(JSON.stringify(result.recordset, null, 2));
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkColumns();
