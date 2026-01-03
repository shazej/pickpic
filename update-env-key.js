
const fs = require('fs');
const path = require('path');

const key = 'AIzaSyCyqz5UadIEHDHYIq6WI6mAHtijSs_o9po';
const files = ['.env', '.env.production', '.env.local'];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('GOOGLE_GENAI_API_KEY=')) {
            content = content.replace(/GOOGLE_GENAI_API_KEY=.*/g, `GOOGLE_GENAI_API_KEY=${key}`);
        } else {
            content += `\nGOOGLE_GENAI_API_KEY=${key}\n`;
        }

        // Also update GEMINI_API_KEY as per debug guide
        if (content.includes('GEMINI_API_KEY=')) {
            content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${key}`);
        } else {
            content += `GEMINI_API_KEY=${key}\n`;
        }

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    } else {
        fs.writeFileSync(filePath, `GOOGLE_GENAI_API_KEY=${key}\nGEMINI_API_KEY=${key}\n`);
        console.log(`Created ${file}`);
    }
});
