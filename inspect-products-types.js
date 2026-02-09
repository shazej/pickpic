
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

        const tables = ['marketplace.Products', 'marketplace.Categories', 'dbo.Categories'];

        for (const table of tables) {
            console.log(`\n--- Type details for ${table} ---`);
            const result = await pool.request().query(`
                SELECT c.name, t.name as type
                FROM sys.columns c
                JOIN sys.types t ON c.user_type_id = t.user_type_id
                WHERE c.object_id = OBJECT_ID('${table}')
            `);
            console.log(result.recordset);
        }

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
