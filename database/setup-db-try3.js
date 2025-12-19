
const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbServer = process.env.DB_SERVER || 'localhost';
const [server, port] = dbServer.split(',');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: server,
    port: port ? parseInt(port) : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433),
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Server likely requires encryption
        trustServerCertificate: true, // Self-signed or mismatched cert is fine
        connectTimeout: 30000,
        cryptoCredentialsDetails: {
            minVersion: 'TLSv1',
            servername: 'example.com' // CRITICAL: This bypasses Node's "IP is not a hostname" check for SNI
        }
    }
};

async function runSchema() {
    try {
        console.log('Connecting to database...');
        console.log(`Server: ${config.server}`);
        console.log(`Port: ${config.port}`);
        console.log(`User: ${config.user}`);

        const pool = await sql.connect(config);
        console.log('Connected!');

        console.log('Ensuring super_admin role...');
        const roleCheck = await pool.request().query("SELECT * FROM roles WHERE name = 'super_admin'");
        if (roleCheck.recordset.length === 0) {
            await pool.request().query("INSERT INTO roles (name) VALUES ('super_admin')");
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
        console.error('Error:', err);
        process.exit(1);
    }
}

runSchema();
