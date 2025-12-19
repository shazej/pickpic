
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

        console.log('--- Foreign Keys on marketplace.Products ---');
        const result = await pool.request().query(`
            SELECT fk.name AS fk_name,
                   c.name AS column_name,
                   rt.name AS referenced_table
            FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            JOIN sys.columns c ON fkc.parent_column_id = c.column_id AND fkc.parent_object_id = c.object_id
            JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
            WHERE fk.parent_object_id = OBJECT_ID('marketplace.Products')
        `);
        console.log(result.recordset);

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
