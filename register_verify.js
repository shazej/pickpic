
async function register() {
    try {
        const response = await fetch('http://localhost:4501/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testverify@example.com',
                password: 'Password123!',
                name: 'System Verify'
            })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}
register();
