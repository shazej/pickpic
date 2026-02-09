
import { getPool } from "./src/lib/db";

async function check() {
    try {
        const pool = await getPool();
        if (!pool) {
            console.log("Pool is null");
            return;
        }
        const res = await pool.request().query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'compliance'");
        if (res.recordset.length > 0) {
            console.log("Compliance schema exists. Tables found:", res.recordset.map((r: any) => r.TABLE_NAME).join(', '));
        } else {
            console.log("Compliance schema NOT found.");
        }
    } catch (e) {
        console.error("Check failed:", e);
    }
}
check();
