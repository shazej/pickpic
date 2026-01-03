
const http = require('http');

const data = JSON.stringify({
    message: "Hello, PickPic Assistant!",
    history: []
});

const options = {
    hostname: 'localhost',
    port: 4501,
    path: '/api/ai/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    console.log('Status Code:', res.statusCode);
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();
