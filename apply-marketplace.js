
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Use the same config as apply-schema.js but ensure we target the right DB
const config = "Server=162.55.212.193,14315;Database=pickpic;User Id=sa;Password=V3r!fy#92uM@xTq1zR71;TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=False";

async function applyMarketplaceSchema() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const schemaPath = path.join(__dirname, 'database', 'marketplace_schema.sql');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');

        // Split by GO statements
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

        console.log('Marketplace Schema applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to apply marketplace schema:', err);
        process.exit(1);
    }
}

applyMarketplaceSchema();
