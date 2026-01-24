
import path from 'path';
import dotenv from 'dotenv';

// Load envs
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { ComplianceService } from '@/lib/services/compliance-service';
import { getPool } from '@/lib/db';
import { AdminComplianceChatService } from '@/lib/services/admin-chat-service';

// Mock Auth
const MOCK_ADMIN_ID = '00000000-0000-0000-0000-000000000000'; // Assuming seed admin or we fetch one

async function runTest() {
    try {
        console.log("Starting Compliance Integration Test...");
        const pool = await getPool();

        // 1. Get Admin User for testing
        const uRes = await pool.request().query("SELECT TOP 1 id FROM auth.Users");
        const adminId = uRes.recordset[0]?.id || MOCK_ADMIN_ID;
        console.log(`Using Admin ID: ${adminId}`);

        // 2. Create Policy Draft for 'KW'
        console.log("Creating Policy Draft...");
        const policyId = await ComplianceService.createPolicyDraft('KW', 'Test Policy', adminId);
        console.log(`Policy Created: ${policyId}`);

        // 3. Upsert Rules
        console.log("Upserting Rules...");
        await ComplianceService.upsertRule(policyId, {
            ruleKey: 'LEGAL_DISCLAIMER',
            ruleType: 'Text', // String mapped to enum in service helper
            ruleValue: 'This is a test disclaimer.'
        } as any);
        await ComplianceService.upsertRule(policyId, {
            ruleKey: 'MAX_AGE',
            ruleType: 'Number',
            ruleValue: 18
        } as any);

        // 4. Publish Policy
        console.log("Publishing Policy...");
        await ComplianceService.publishPolicy(policyId, adminId);
        console.log("Policy Published.");

        // 5. Verify Runtime
        console.log("Verifying Runtime Context...");
        const context = await ComplianceService.getRuntimeContext('KW');

        console.log("Runtime Context Result:", JSON.stringify(context, null, 2));

        if (context.policyVersion < 1) throw new Error("Policy Version should be >= 1");
        if (context.rules['LEGAL_DISCLAIMER'] !== 'This is a test disclaimer.') throw new Error("Rule mismatch");
        if (context.rules['MAX_AGE'] !== 18) throw new Error("Rule mismatch (Number)");

        // 6. Test Chat Service (Basic)
        console.log("Testing Chat Session...");
        const sessionId = await AdminComplianceChatService.createSession('KW', adminId);
        console.log(`Chat Session Created: ${sessionId}`);

        // We won't call AI here to avoid external dep failure in test, but we can test message storage
        await AdminComplianceChatService.addMessage(sessionId, 'SystemAdmin', 'Hello Test');
        const history = await AdminComplianceChatService.getHistory(sessionId);
        if (history.length !== 1 || history[0].content !== 'Hello Test') throw new Error("Chat consistency fail");

        console.log("ALL TESTS PASSED");
        process.exit(0);

    } catch (e) {
        console.error("Test Failed:", e);
        process.exit(1);
    }
}

runTest();
