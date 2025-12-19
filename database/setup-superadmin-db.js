
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Hardcoded credentials to avoid dotenv parsing issues with special chars
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

async function runSchema() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        // Run Base Schema First (if needed)
        console.log('Running base schema...');
        const baseSchemaPath = path.join(__dirname, 'schema.sql');
        const baseSchemaSql = fs.readFileSync(baseSchemaPath, 'utf8');
        try {
            await pool.request().query(baseSchemaSql);
            console.log('Base schema executed.');
        } catch (e) {
            console.log('Base schema might already exist or partial error:', e.message);
        }

        // Ensure super_admin role exists
        console.log('Ensuring super_admin role...');
        // Use auth.Roles as per production_schema.sql
        const roleCheck = await pool.request().query("SELECT * FROM auth.Roles WHERE name = 'super_admin'");
        if (roleCheck.recordset.length === 0) {
            await pool.request().query("INSERT INTO auth.Roles (name) VALUES ('super_admin')");
            console.log('Added super_admin role.');
        } else {
            console.log('super_admin role already exists.');
        }

        const schemaPath = path.join(__dirname, 'superadmin_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await pool.request().query(schemaSql);

        console.log('Schema executed successfully.');
        pool.close();
    } catch (err) {
        console.error('Error executing schema:', err);
        process.exit(1);
    }
}

runSchema();
