
require('dotenv').config();

const config = {
    user: 'sa',
    password: process.env.DB_PASSWORD,
    server: 'localhost',
    port: 1433,
    database: 'PICKPIC',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 30000
    }
};

async function applySchema() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);

        console.log('Adding location and contact_info columns to products table...');

        // Add location column if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'location')
            BEGIN
                ALTER TABLE products ADD location NVARCHAR(255) NULL;
                PRINT 'Added location column.';
            END
            ELSE
            BEGIN
                PRINT 'location column already exists.';
            END
        `);

        // Add contact_info column if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'contact_info')
            BEGIN
                ALTER TABLE products ADD contact_info NVARCHAR(MAX) NULL;
                PRINT 'Added contact_info column.';
            END
            ELSE
            BEGIN
                PRINT 'contact_info column already exists.';
            END
        `);

        console.log('Schema update completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error applying schema:', err);
        process.exit(1);
    }
}

applySchema();
