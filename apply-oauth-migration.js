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
    }
};

async function applyMigration() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const migrationPath = path.join(__dirname, 'database', 'oauth_migration.sql');
        const migrationContent = fs.readFileSync(migrationPath, 'utf8');

        const batches = migrationContent
            .split(/\r\n|\n/)
            .reduce((acc, line) => {
                if (line.trim().toUpperCase() === 'GO') {
                    acc.push([]);
                } else {
                    if (acc.length === 0) acc.push([]);
                    acc[acc.length - 1].push(line);
                }
                return acc;
            }, [])
            .map(batch => batch.join('\n'))
            .filter(batch => batch.trim().length > 0);

        console.log(`Found ${batches.length} batches to execute.`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Executing batch ${i + 1}/${batches.length}...`);
            await pool.request().query(batch);
            console.log(`Batch ${i + 1} Success`);
        }

        console.log('Migration applied successfully.');
        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('Failed to apply migration:', err);
        process.exit(1);
    }
}

applyMigration();
