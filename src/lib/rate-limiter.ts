
/**
 * Simple In-Memory Rate Limiter
 * In production, consider using Redis.
 */

const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (record.count >= limit) {
        return true;
    }

    record.count++;
    return false;
}
