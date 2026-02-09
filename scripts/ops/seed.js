const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
    user: 'sa',
    password: 'PickPicStrongPass1!',
    server: 'WIN-LE7OOSFFT8H',
    port: 1433,
    database: 'PickPicDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function seed() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected!');

        const sellerPass = await bcrypt.hash('SellerPass123!', 10);
        const adminPass = await bcrypt.hash('AdminSecret1!', 10);

        // Admin
        const adminEmail = 'admin@pickpic.com';
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM users WHERE email = '${adminEmail}')
            BEGIN
                INSERT INTO users (email, password_hash, full_name, is_verified)
                VALUES ('${adminEmail}', '${adminPass}', 'Super Admin', 1);
            END
        `);

        // Seller
        const sellerEmail = 'seller@example.com';
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM users WHERE email = '${sellerEmail}')
            BEGIN
                INSERT INTO users (email, password_hash, full_name, is_verified)
                VALUES ('${sellerEmail}', '${sellerPass}', 'Test Seller', 1);
            END
        `);

        console.log('Seeding Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    }
}

seed();
