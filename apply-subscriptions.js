
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Use env vars or fallback to the hardcoded dev/prod string if needed (copying from db.ts logic roughly)
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'V3r!fy#92uM@xTq1zR71',
    server: process.env.DB_SERVER || 'static.193.212.55.162.clients.your-server.de',
    port: parseInt(process.env.DB_PORT || '1434'),
    database: process.env.DB_NAME || 'PickPic',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    }
};

async function apply() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const schemaPath = path.join(__dirname, 'database', 'cleanup.sql');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');

        // Execute as a single batch since it's small, or split if needed.
        // The file has GO check? No, I put GO at end. MSSQL node driver doesn't like GO usually unless splitting.
        // My file content:
        // IF NOT EXISTS ...
        // GO

        // I should strip GO.
        const batches = schemaContent
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

        for (const batch of batches) {
            await pool.request().query(batch);
        }

        console.log('Subscriptions table created.');
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}

apply();
