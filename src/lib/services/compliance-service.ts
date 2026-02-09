
import { getPool, sql } from "@/lib/db";
import {
    ComplianceCountry, CompliancePolicy, ComplianceRule, ComplianceKB,
    ComplianceRuntimeContext, RuleType
} from "@/lib/compliance-types";

export class ComplianceService {

    // --- Policies ---

    static async getPolicies(countryIso: string): Promise<CompliancePolicy[]> {
        const pool = await getPool();
        const res = await pool.request()
            .input('iso', sql.NVarChar, countryIso)
            .query(`
                SELECT p.* 
                FROM compliance.Policies p
                JOIN compliance.Countries c ON p.country_id = c.id
                WHERE c.iso_code = @iso
                ORDER BY p.version DESC
            `);
        return res.recordset;
    }

    static async createPolicyDraft(countryIso: string, notes?: string, creatorId?: string): Promise<string> {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Get Country ID
            const cRes = await transaction.request()
                .input('iso', sql.NVarChar, countryIso)
                .query(`SELECT id FROM compliance.Countries WHERE iso_code = @iso`);

            if (!cRes.recordset[0]) throw new Error(`Country ${countryIso} not found`);
            const countryId = cRes.recordset[0].id;

            // Get Next Version
            const vRes = await transaction.request()
                .input('cid', sql.Int, countryId)
                .query(`SELECT ISNULL(MAX(version), 0) + 1 as nextVer FROM compliance.Policies WHERE country_id = @cid`);
            const nextVer = vRes.recordset[0].nextVer;

            // Create Policy
            const pRes = await transaction.request()
                .input('cid', sql.Int, countryId)
                .input('ver', sql.Int, nextVer)
                .input('notes', sql.NVarChar, notes)
                .input('creator', sql.UniqueIdentifier, creatorId)
                .query(`
                    INSERT INTO compliance.Policies (country_id, version, status, notes, created_by)
                    OUTPUT INSERTED.id
                    VALUES (@cid, @ver, 'Draft', @notes, @creator)
                `);
            const policyId = pRes.recordset[0].id;

            // Optional: Copy rules from previous active policy?
            // For now, start empty or implemented later as "Clone"

            await transaction.commit();
            return policyId;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async publishPolicy(policyId: string, actorId?: string): Promise<void> {
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Get Policy Info
            const pRes = await transaction.request()
                .input('pid', sql.UniqueIdentifier, policyId)
                .query(`SELECT country_id, status FROM compliance.Policies WHERE id = @pid`);
            const policy = pRes.recordset[0];

            if (!policy) throw new Error("Policy not found");
            if (policy.status !== 'Draft') throw new Error("Only Draft policies can be published");

            // Archive currently Active policies for this country
            await transaction.request()
                .input('cid', sql.Int, policy.country_id)
                .query(`
                    UPDATE compliance.Policies 
                    SET status = 'Archived', updated_at = SYSDATETIME()
                    WHERE country_id = @cid AND status = 'Active'
                `);

            // Activate new policy
            await transaction.request()
                .input('pid', sql.UniqueIdentifier, policyId)
                .input('actor', sql.UniqueIdentifier, actorId)
                .query(`
                    UPDATE compliance.Policies
                    SET status = 'Active', effective_from = SYSDATETIME(), updated_by = @actor, updated_at = SYSDATETIME()
                    WHERE id = @pid
                `);

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    // --- Rules ---

    static async upsertRule(policyId: string, rule: Partial<ComplianceRule>): Promise<void> {
        const pool = await getPool();
        // Simple merge
        // If ID exists update, else insert
        // Actually typically we upsert by Rule Key for a given Policy

        if (!rule.ruleKey) throw new Error("Rule Key is required");

        await pool.request()
            .input('pid', sql.UniqueIdentifier, policyId)
            .input('key', sql.NVarChar, rule.ruleKey)
            .input('type', sql.NVarChar, rule.ruleType || RuleType.Text)
            .input('val', sql.NVarChar, typeof rule.ruleValue === 'object' ? JSON.stringify(rule.ruleValue) : String(rule.ruleValue))
            .input('priority', sql.Int, rule.priority || 0)
            .input('enabled', sql.Bit, rule.isEnabled !== false ? 1 : 0) // Default true
            .query(`
                MERGE compliance.Rules AS target
                USING (SELECT @pid as policy_id, @key as rule_key) AS source
                ON (target.policy_id = source.policy_id AND target.rule_key = source.rule_key)
                WHEN MATCHED THEN
                    UPDATE SET 
                        rule_type = @type, 
                        rule_value = @val, 
                        priority = @priority, 
                        is_enabled = @enabled,
                        updated_at = SYSDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT (policy_id, rule_key, rule_type, rule_value, priority, is_enabled)
                    VALUES (@pid, @key, @type, @val, @priority, @enabled);
            `);
    }

    static async getRules(policyId: string): Promise<ComplianceRule[]> {
        const pool = await getPool();
        const res = await pool.request()
            .input('pid', sql.UniqueIdentifier, policyId)
            .query(`SELECT * FROM compliance.Rules WHERE policy_id = @pid ORDER BY priority DESC`);

        return res.recordset.map(processRuleRecord);
    }

    // --- Knowledge Base ---

    static async createKBDraft(kb: Partial<ComplianceKB>): Promise<string> {
        const pool = await getPool();

        const cRes = await pool.request()
            .input('iso', sql.NVarChar, kb.countryId ? undefined : 'KW') // Fallback or need ISO logic
            // Ideally we pass Country ID directly
            .query(`SELECT id FROM compliance.Countries WHERE id = ${kb.countryId || 0}`);

        // Simplified: Assume caller passes valid IDs or we look up by ISO if needed. 
        // Let's assume kb.countryId is actually needed.

        const res = await pool.request()
            .input('cid', sql.Int, kb.countryId)
            .input('pid', sql.UniqueIdentifier, kb.policyId)
            .input('title', sql.NVarChar, kb.title)
            .input('content', sql.NVarChar, kb.content)
            .input('refs', sql.NVarChar, JSON.stringify(kb.sourceRefs || []))
            .input('tags', sql.NVarChar, JSON.stringify(kb.tags || []))
            .query(`
                INSERT INTO compliance.KnowledgeBase (country_id, policy_id, title, content, source_refs, tags, status, version)
                OUTPUT INSERTED.id
                VALUES (@cid, @pid, @title, @content, @refs, @tags, 'Draft', 1)
            `);
        return res.recordset[0].id;
    }

    static async publishKB(kbId: string): Promise<void> {
        const pool = await getPool();
        // Simple update status for now. Real world might involve versioning checks.
        await pool.request()
            .input('id', sql.UniqueIdentifier, kbId)
            .query(`UPDATE compliance.KnowledgeBase SET status = 'Active', updated_at = SYSDATETIME() WHERE id = @id`);
    }

    static async getActiveKB(countryIso: string): Promise<ComplianceKB[]> {
        const pool = await getPool();
        const res = await pool.request()
            .input('iso', sql.NVarChar, countryIso)
            .query(`
                SELECT k.* 
                FROM compliance.KnowledgeBase k
                JOIN compliance.Countries c ON k.country_id = c.id
                WHERE c.iso_code = @iso AND k.status = 'Active'
            `);
        return res.recordset.map(processKBRecord);
    }

    // --- Runtime ---

    static async getRuntimeContext(countryIso: string): Promise<ComplianceRuntimeContext> {
        const pool = await getPool();

        // 1. Get Active Policy
        const pRes = await pool.request()
            .input('iso', sql.NVarChar, countryIso)
            .query(`
                SELECT TOP 1 p.* 
                FROM compliance.Policies p
                JOIN compliance.Countries c ON p.country_id = c.id
                WHERE c.iso_code = @iso AND p.status = 'Active'
                ORDER BY p.version DESC
            `);

        const policy = pRes.recordset[0];
        const rulesMap: Record<string, any> = {};
        let policyVersion = 0;

        if (policy) {
            policyVersion = policy.version;

            // 2. Get Rules
            const rRes = await pool.request()
                .input('pid', sql.UniqueIdentifier, policy.id)
                .query(`SELECT * FROM compliance.Rules WHERE policy_id = @pid AND is_enabled = 1 ORDER BY priority DESC`);

            rRes.recordset.forEach(r => {
                const processed = processRuleRecord(r);
                rulesMap[processed.ruleKey] = processed.ruleValue;
            });
        }

        // 3. Get KB
        const kbSnippets = await this.getActiveKB(countryIso);

        return {
            countryIso,
            policyVersion,
            rules: rulesMap,
            kbSnippets,
            disclaimerText: rulesMap['LEGAL_DISCLAIMER'] || undefined
        };
    }
}

// Helpers
function processRuleRecord(r: any): ComplianceRule {
    let val = r.rule_value;
    if (r.rule_type === RuleType.JSON || r.rule_type === RuleType.Boolean || r.rule_type === RuleType.Number) {
        try { val = JSON.parse(val); } catch { }
    }
    // Boolean explicit conversion if stored as strings
    if (r.rule_type === RuleType.Boolean && typeof val === 'string') {
        val = val.toLowerCase() === 'true';
    }

    return {
        id: r.id,
        policyId: r.policy_id,
        ruleKey: r.rule_key,
        ruleType: r.rule_type as RuleType,
        ruleValue: val,
        priority: r.priority,
        isEnabled: r.is_enabled
    };
}

function processKBRecord(r: any): ComplianceKB {
    return {
        id: r.id,
        countryId: r.country_id,
        policyId: r.policy_id,
        title: r.title,
        content: r.content,
        sourceRefs: safeJsonParse(r.source_refs),
        tags: safeJsonParse(r.tags),
        version: r.version,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}

function safeJsonParse(str: string): any {
    try {
        return str ? JSON.parse(str) : undefined;
    } catch {
        return [];
    }
}
