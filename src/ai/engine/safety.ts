
import { logger } from "@/lib/logger";

export class SafetyGuard {
    private static instance: SafetyGuard;

    // Basic blocklist for MVP/Fallback
    private blockedTerms = [
        "nsfw", "porn", "xxx", "kill yourself", "bomb", "terrorist"
    ];

    private constructor() { }

    static getInstance(): SafetyGuard {
        if (!SafetyGuard.instance) {
            SafetyGuard.instance = new SafetyGuard();
        }
        return SafetyGuard.instance;
    }

    async validate(text: string): Promise<boolean> {
        // 1. Basic Keyword Check (Fast fail)
        const lower = text.toLowerCase();
        if (this.blockedTerms.some(term => lower.includes(term))) {
            logger.warn("SafetyGuard: Blocked keyword match", { text: text.substring(0, 50) });
            return false;
        }

        // 2. OpenAI Moderation API (If configured)
        if (process.env.OPENAI_API_KEY) {
            try {
                const res = await fetch('https://api.openai.com/v1/moderations', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ input: text }),
                });

                if (res.ok) {
                    const data = await res.json();
                    const result = data.results[0];
                    if (result.flagged) {
                        logger.warn("SafetyGuard: OpenAI flagged content", { categories: result.categories });
                        return false;
                    }
                }
            } catch (e) {
                logger.error("SafetyGuard: Moderation API failed, failing open (or closed based on policy)", e);
                // Fail open for API error? Or closed? 
                // For MVP, fail open to avoid blocking legit users on API outage, but log it.
            }
        }

        return true;
    }
}

export const safetyGuard = SafetyGuard.getInstance();
