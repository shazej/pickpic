
const sql = require('mssql');

// Standard local defaults or from .env.local
const config = {
    user: 'sa',
    password: 'SaPassword123!',
    server: '127.0.0.1',
    port: 1434,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function test() {
    try {
        console.log('Connecting to Localhost...');
        await sql.connect(config);
        console.log('Connected to Localhost SA');

        const res = await sql.query("SELECT name FROM sys.databases WHERE name = 'PICKPIC'");
        if (res.recordset.length > 0) {
            console.log('DB Found: PICKPIC');
        } else {
            console.log('DB NOT Found: PICKPIC');
        }

        process.exit(0);
    } catch (e) {
        console.error('Local Connection Failed:', e.message);
        process.exit(1);
    }
}

test();
