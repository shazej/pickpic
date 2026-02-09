const sql = require('mssql');

const config = "Server=162.55.212.193,1434;Database=pickpic;User Id=sa;Password=V3r!fy#92uM@xTq1zR71;TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=False";

async function verifyAdditions() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);
        console.log('Connected.');

        console.log('--- Checking for added car listings ---');
        const result = await pool.request().query(`
            SELECT p.id, p.title, p.price, a.attributes_json, i.image_url
            FROM marketplace.Products p
            LEFT JOIN marketplace.ProductAttributes a ON p.id = a.product_id
            LEFT JOIN marketplace.ProductImages i ON p.id = i.product_id
            WHERE p.title IN (N'مرسيدس CLA 200 2021', N'وانيت مازدا 2015')
        `);

        console.log(JSON.stringify(result.recordset, null, 2));

        if (result.recordset.length >= 2) {
            console.log('Verification successful: Both listings found.');
        } else {
            console.error(`Verification failed: Expected 2 listings, found ${result.recordset.length}.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    }
}

verifyAdditions();
