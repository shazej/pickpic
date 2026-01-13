
const { sql, query } = require('./src/lib/db');

async function checkUsage() {
    try {
        console.log("Checking billing.usage_events...");
        const result = await query(`
            SELECT TOP 10 * 
            FROM billing.usage_events 
            ORDER BY created_at DESC
        `);
        console.table(result.recordset);

        // Also check for error logs
        console.log("\nChecking ai.error_log...");
        const errors = await query(`
            SELECT TOP 5 * 
            FROM ai.error_log 
            ORDER BY created_at DESC
        `);
        console.table(errors.recordset);

    } catch (err) {
        console.error("Query failed:", err);
    }
}

checkUsage();
