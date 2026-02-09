
/**
 * Strict JSON output contract for PickPic
 */
export const SYSTEM_PROMPT_PICKPIC = `
RESPONSE SCHEMA (MANDATORY):
{
  "intent": "search | list | compare | clarify | no_match",
  "confidence": 0.0-1.0,
  "clarifying_question": "string or null",
  "listing_fields": {
    "category": "string or null",
    "brand": "string or null",
    "model": "string or null",
    "condition": "new | used | refurbished | null",
    "color": "string or null",
    "size": "string or null",
    "material": "string or null",
    "price_suggestion": "number or null",
    "tags": ["string"]
  },
  "matched_products": [
    { "product_id": "string", "reason": "short explanation" }
  ],
  "response_text": "user-facing message"
}

Rules:
- During SELLER listing creation: focus on listing_fields and clarifying_question.
- During BUYER search: focus on matched_products and response_text; listing_fields can be null.
- Never hallucinate product IDs; use only IDs provided in backend context.
- Return ONLY JSON. No markdown. No extra text.
`.trim();

/**
 * Enforces JSON schema strictly with one repair attempt
 */
export async function enforceJson(rawOutput: string, repairFn?: (error: string) => Promise<string>): Promise<any> {
    try {
        // Try simple parse first
        // AI might wrap in markdown blocks
        const cleanContent = rawOutput.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
        return JSON.parse(cleanContent);
    } catch (e: any) {
        if (repairFn) {
            console.warn("JSON Parse failed, attempting repair...");
            const repairedOutput = await repairFn(e.message);
            try {
                const cleanRepaired = repairedOutput.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
                return JSON.parse(cleanRepaired);
            } catch (e2) {
                console.error("JSON Repair failed.");
            }
        }

        // Final fallback
        return {
            intent: "clarify",
            confidence: 0.2,
            clarifying_question: "Please rephrase or add more details.",
            response_text: "I'm sorry, I couldn't quite understand that. Could you please provide more details?"
        };
    }
}
