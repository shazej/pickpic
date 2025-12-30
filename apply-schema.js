
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = "Server=static.193.212.55.162.clients.your-server.de,1434;Database=PickPic;User Id=sa;Password=V3r!fy#92uM@xTq1zR71;TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=True";

async function applySchema() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        const schemaPath = path.join(__dirname, 'database', 'production_schema.sql');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');

        // Split by GO statements (case insensitive, surrounded by whitespace)
        // Regex: /^\s*GO\s*$/gmi (multiline)
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
                // Check if batch contains 'USE PickPic'. If so, and we are already connected to it, it might be fine, 
                // but 'CREATE DATABASE' needs master. 
                // Our config connects to 'pickpic'.
                // If the script creates the DB, it should nominally be run from master.
                // However, the DB exists. The script checks IF NOT EXISTS.
                // We will just try running the batch.
                await pool.request().query(batch);
                console.log(`Batch ${i + 1} Result: Success`);
            } catch (err) {
                console.error(`Error executing batch ${i + 1}:`, err.message);
                // Continue or stop? Stop is safer.
                throw err;
            }
        }

        console.log('Schema applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to apply schema:', err);
        process.exit(1);
    }
}

applySchema();
