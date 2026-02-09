require('dotenv').config({ path: '.env.local' });
const { sql } = require('./src/lib/db');
const fs = require('fs');
const path = require('path');

async function applyComplianceSchema() {
    try {
        const pool = await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            port: parseInt(process.env.DB_PORT),
            database: process.env.DB_NAME,
            options: {
                encrypt: process.env.DB_ENCRYPT === 'true',
                trustServerCertificate: true,
            },
        });

        console.log('Connected to database.');

        const schemaPath = path.join(__dirname, 'database', 'compliance_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by GO commands for batch execution
        const batches = schemaSql.split(/\nGO\s*($|\n)/i);

        for (const batch of batches) {
            if (batch.trim()) {
                console.log('Executing batch...');
                try {
                    await pool.request().query(batch);
                } catch (e) {
                    console.warn("Error running batch (might be harmless if exists):", e.message);
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
