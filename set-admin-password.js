const sql = require('mssql');
const bcrypt = require('bcryptjs');

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

async function setAdminPassword() {
    try {
        const pool = await sql.connect(config);
        const hash = await bcrypt.hash('Admin123!', 10);

        // Update hash for admin user
        await pool.request()
            .input('hash', sql.VarBinary(sql.MAX), Buffer.from(hash, 'utf-8'))
            .input('email', sql.NVarChar, 'admin@pickpic.com')
            .query('UPDATE auth.Users SET password_hash = @hash WHERE email = @email');

        console.log('Admin password updated to: Admin123!');
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}

setAdminPassword();
