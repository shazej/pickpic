
const { SignJWT, jwtVerify } = require('jose');
const crypto = require('crypto');

async function testJose() {
    console.log("Testing JOSE library...");
    try {
        const secret = new TextEncoder().encode('cc7e0d44fd473002f1c42167459001140e428a238a5aa782750e0250d0901850');
        const alg = 'HS256';

        const jwt = await new SignJWT({ 'urn:example:claim': true })
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setIssuer('urn:example:issuer')
            .setAudience('urn:example:audience')
            .setExpirationTime('2h')
            .sign(secret);

        console.log("JWT Signed:", jwt);

        const { payload, protectedHeader } = await jwtVerify(jwt, secret, {
            issuer: 'urn:example:issuer',
            audience: 'urn:example:audience',
        });

        console.log("JWT Verified:", payload);
        console.log("JOSE Test PASSED");
    } catch (e) {
        console.error("JOSE Test FAILED:", e);
        process.exit(1);
    }
}

testJose();
