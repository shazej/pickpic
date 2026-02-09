import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-at-least-32-chars-long-!!!';

function getDerivedKey() {
    return crypto.scryptSync(SECRET, 'salt', 32);
}

export function encrypt_token(text: string | null | undefined): string | null {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getDerivedKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decrypt_token(text: string | null): string | null {
    if (!text) return null;
    try {
        const [ivHex, tagHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const key = getDerivedKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}
