
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = "Server=static.193.212.55.162.clients.your-server.de,1434;Database=PickPic;User Id=sa;Password=V3r!fy#92uM@xTq1zR71;TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=True";

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const migrationPath = path.join(__dirname, 'database', 'migrations', '01_country_pricing.sql');
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
            try {
                await pool.request().query(batch);
                console.log(`Batch ${i + 1} Result: Success`);
            } catch (err) {
                console.error(`Error executing batch ${i + 1}:`, err.message);
                throw err;
            }
        }

        console.log('Migration applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to apply migration:', err);
        process.exit(1);
    }
}

runMigration();
