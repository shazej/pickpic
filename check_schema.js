const { query } = require('./src/lib/db');

async function run() {
    try {
        const res = await query("SELECT TOP 1 * FROM marketplace.SellerProfiles");
        console.log('Columns:', Object.keys(res.recordset[0] || {}));
    } catch (e) {
        console.error(e);
    }
}

run();
