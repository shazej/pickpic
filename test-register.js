async function testRegister() {
    try {
        const response = await fetch('http://localhost:9002/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testnode' + Date.now() + '@example.com',
                password: 'Password123!',
                name: 'Node Test'
            })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testRegister();
