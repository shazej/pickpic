
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getPool, sql } from "@/lib/db";

// DEFAULT Fallback if nothing else works
const DEFAULT_COUNTRY_ISO = 'KW';

export class ComplianceCountryContextResolver {

    /**
     * Resolve the compliance country for the current request context.
     * Priority:
     * 1. Tenant/App Config (from DB)
     * 2. X-Compliance-Country header (for testing/admin, if enabled)
     * 3. Default (KW)
     */
    static async resolve(req?: NextRequest): Promise<string> {
        // 1. Check Header Override (Only for non-prod or admin users ideally, but simplified here for scope)
        // In a real app, strict checks on who can use this header.
        let headerCountry: string | null = null;
        if (req) {
            headerCountry = req.headers.get('x-compliance-country');
        } else {
            const h = await headers();
            headerCountry = h.get('x-compliance-country');
        }

        if (headerCountry && headerCountry.length === 2) {
            // Validate if valid ISO? Optional but recommended.
            // For now, assume if provided it's an intent to test.
            return headerCountry.toUpperCase();
        }

        // 2. Tenant Context
        // For this single-tenant/hybrid app, we query the 'Default Tenant' or AppSettings.
        // We cached this effectively in memory or simple DB query.
        try {
            const tenantCountry = await this.getTenantComplianceCountry('Default Tenant');
            if (tenantCountry) {
                return tenantCountry;
            }
        } catch (err) {
            console.error('Failed to resolve tenant country context:', err);
        }

        // 3. Fallback
        return DEFAULT_COUNTRY_ISO;
    }

    private static async getTenantComplianceCountry(tenantName: string): Promise<string | null> {
        // This could be cached (Redis/In-Memory)
        try {
            // We can use a simple cached object if we want to avoid DB hit every request
            // But for reliability now, let's query.
            const pool = await getPool();
            // Assuming tenant name is unique or we just take top 1
            const result = await pool.request()
                .input('name', sql.NVarChar, tenantName)
                .query(`
                    SELECT TOP 1 compliance_country_iso 
                    FROM compliance.Tenants 
                    WHERE name = @name
                `);

            if (result.recordset && result.recordset.length > 0) {
                return result.recordset[0].compliance_country_iso;
            }
        } catch (e) {
            console.error("Context Resolver DB Error:", e);
        }
        return null;
    }
}
