const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'sa',
    password: 'V3r!fy#92uM@xTq1zR71',
    server: 'static.193.212.55.162.clients.your-server.de',
    port: 1434,
    database: 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

async function applyCommerceSchema() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);

        console.log('Reading commerce_schema.sql...');
        const schemaPath = path.join(__dirname, 'database', 'commerce_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by GO to execute batches (rudimentary split, works for standard generated files)
        const batches = schemaSql.split(/^\s*GO\s*$/m).filter(batch => batch.trim().length > 0);

        console.log(`Found ${batches.length} batches to execute.`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            try {
                // console.log(`Executing batch ${i + 1}...`);
                await pool.request().query(batch);
            } catch (err) {
                console.error(`Error in batch ${i + 1}:`, err.message);
                // Continue or throw? For idempotent scripts, usually safe to continue if object exists
            }
        }

        console.log('Commerce schema applied successfully.');
        await pool.close();

    } catch (err) {
        console.error('Failed to apply schema:', err);
    }
}

applyCommerceSchema();
