
const { SignJWT } = require('jose');

const secretKey = 'your-secret-key-change-in-production';
const key = new TextEncoder().encode(secretKey);

async function encrypt(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(key);
}

async function run() {
    const userData = { id: '00000000-0000-0000-0000-000000000001', name: 'Demo User', email: 'demo@example.com' };
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await encrypt({ user: userData, expires });
    console.log(token);
}

run();
