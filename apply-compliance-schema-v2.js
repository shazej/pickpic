const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // fallback to .env
}

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    },
};

async function applyComplianceSchema() {
    try {
        console.log(`Connecting to ${config.server}:${config.port} / ${config.database} as ${config.user}...`);
        const pool = await sql.connect(config);
        console.log('Connected to database.');

        const schemaPath = path.join(__dirname, 'database', 'compliance_schema.sql');
        console.log(`Reading schema from ${schemaPath}...`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by GO commands for batch execution
        // Regex handles GO on its own line case-insensitive
        const batches = schemaSql.split(/^\s*GO\s*$/im);

        let count = 0;
        for (const batch of batches) {
            const cleanBatch = batch.trim();
            if (cleanBatch) {
                count++;
                console.log(`Executing batch #${count}...`);
                try {
                    await pool.request().query(cleanBatch);
                } catch (e) {
                    console.warn(`Warning in batch #${count}: ${e.message}`);
                    // Continue even if error (e.g. "object already exists")
                }
            }
        }

        console.log('Compliance schema applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    }
}

applyComplianceSchema();
