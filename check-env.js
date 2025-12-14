const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');

console.log('Checking .env.local at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('File exists.');
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        if (line.trim().startsWith('NEXT_PUBLIC_FIREBASE_API_KEY')) {
            console.log('Found API_KEY line:', line.substring(0, 35) + '...');
        }
    });
} else {
    console.log('File does NOT exist.');
}
