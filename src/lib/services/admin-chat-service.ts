
import { getPool, sql } from '@/lib/db';
import { AiService } from '@/services/ai-service';

export class AdminComplianceChatService {

    static async createSession(countryIso: string, userId: string): Promise<string> {
        const pool = await getPool();
        // Resolve Country ID
        const cRes = await pool.request()
            .input('iso', sql.NVarChar, countryIso)
            .query('SELECT id FROM compliance.Countries WHERE iso_code = @iso');

        if (!cRes.recordset[0]) throw new Error("Invalid Country ISO");
        const countryId = cRes.recordset[0].id;

        const res = await pool.request()
            .input('cid', sql.Int, countryId)
            .input('uid', sql.UniqueIdentifier, userId)
            .query(`
                INSERT INTO compliance.AdminChatSessions (country_id, created_by, status)
                OUTPUT INSERTED.id
                VALUES (@cid, @uid, 'Active')
            `);
        return res.recordset[0].id;
    }

    static async addMessage(sessionId: string, role: 'SystemAdmin' | 'Assistant', message: string, meta?: any): Promise<void> {
        const pool = await getPool();
        await pool.request()
            .input('sid', sql.UniqueIdentifier, sessionId)
            .input('role', sql.NVarChar, role)
            .input('msg', sql.NVarChar, message)
            .input('meta', sql.NVarChar, meta ? JSON.stringify(meta) : null)
            .query(`
                INSERT INTO compliance.AdminChatMessages (session_id, role, message, meta_json)
                VALUES (@sid, @role, @msg, @meta)
            `);
    }

    static async getHistory(sessionId: string) {
        const pool = await getPool();
        const res = await pool.request()
            .input('sid', sql.UniqueIdentifier, sessionId)
            .query(`SELECT role, message FROM compliance.AdminChatMessages WHERE session_id = @sid ORDER BY created_at ASC`);
        return res.recordset.map(r => ({
            role: r.role === 'SystemAdmin' ? 'user' : 'model',
            content: r.message
        }));
    }

    static async processUserMessage(sessionId: string, message: string, userId: string) {
        // 1. Store User Message
        await this.addMessage(sessionId, 'SystemAdmin', message);

        // 2. Load History & Context
        const pool = await getPool();
        const sRes = await pool.request()
            .input('sid', sql.UniqueIdentifier, sessionId)
            .query(`
                SELECT c.name, c.iso_code 
                FROM compliance.AdminChatSessions s
                JOIN compliance.Countries c ON s.country_id = c.id
                WHERE s.id = @sid
            `);
        const sessionInfo = sRes.recordset[0];
        const countryName = sessionInfo.name;

        // 3. Prepare AI Request
        const history = await this.getHistory(sessionId);
        // history includes the message we just added

        const systemPrompt = `You are an expert legal compliance assistant for ${countryName} (${sessionInfo.iso_code}). 
        Your goal is to help the admin draft Knowledge Base entries and Policies.
        If the admin provides legal text, analyze it and propose a structured KB entry in JSON format within your response.
        Format proposed KB as:
        \`\`\`json
        {
            "title": "Title of the entry",
            "content": "Summary or full text...",
            "tags": ["tag1", "tag2"],
            "sourceRefs": ["Law #123"]
        }
        \`\`\`
        Rationale: Explain your reasoning briefly.
        `;

        // We construct proper ChatRequest for AiService
        // AiService.chat expects specific format, let's adapt or use Engine directly if needed.
        // AiService.chat takes { messages: [...] }

        const response = await AiService.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                ...history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', content: h.content }))
            ]
        }, userId, 'admin_compliance_chat');

        const aiText = response.content || response.text || "No response"; // Adjust based on AiService return type

        // 4. Extract JSON if present in aiText (Simple regex)
        let meta = {};
        const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/{[\s\S]*}/);
        if (jsonMatch) {
            try {
                // If it was fenced, use group 1, else use full match
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                const data = JSON.parse(jsonStr);
                meta = { proposedKB: data };
            } catch (e) {
                console.warn("Failed to parse AI JSON", e);
            }
        }

        // 5. Store Assistant Message
        await this.addMessage(sessionId, 'Assistant', aiText, meta);

        return {
            response: aiText,
            meta
        };
    }
}
