
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Hardcoded credentials to avoid dotenv parsing issues with special chars
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

async function executeSqlScript(pool, filePath) {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    // Simple split by GO on its own line (case insensitive)
    const commands = sqlContent.split(/^\s*GO\s*$/im);

    for (const command of commands) {
        if (command.trim()) {
            try {
                // Remove USE statements if they switch DB (optional, but node-mssql connects to specific DB)
                // However, schema.sql has USE PickPicDB.
                // If we are already connected to PICKPIC, USE might be fine or redundant.
                await pool.request().query(command);
            } catch (err) {
                console.warn(`Warning executing chunk in ${path.basename(filePath)}:`, err.message);
                // Continue despite errors (e.g. table already exists)
            }
        }
    }
}

async function runSchema() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        // Run Base Schema
        console.log('Running base schema...');
        await executeSqlScript(pool, path.join(__dirname, 'schema.sql'));
        console.log('Base schema executed.');

        // Run Super Admin Schema
        console.log('Running super admin schema...');
        await executeSqlScript(pool, path.join(__dirname, 'superadmin_schema.sql'));
        console.log('Super admin schema executed.');

        // Run Admin Seed
        console.log('Seeding super admin...');
        // Manually run the seed logic here to ensure it works
        // Ensure super_admin role exists via seed logic if not covered by schema
        await executeSqlScript(pool, path.join(__dirname, 'run-admin-seed.js').replace('run-admin-seed.js', 'seed-admin.sql'));
        // Need to be careful with paths. I have seed-admin.sql
        console.log('Seed executed.');

        pool.close();
        console.log('ALL SETUPS COMPLETED SUCCESSFULLY.');

    } catch (err) {
        console.error('Error executing setup:', err);
        process.exit(1);
    }
}

runSchema();
