
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const aiKey = process.env.GOOGLE_GENAI_API_KEY;
if (aiKey) {
    console.log('GOOGLE_GENAI_API_KEY is SET. Length:', aiKey.length);
} else {
    console.log('GOOGLE_GENAI_API_KEY is NOT set.');
}

const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey) {
    console.log('GEMINI_API_KEY is SET. Length:', geminiKey.length);
} else {
    console.log('GEMINI_API_KEY is NOT set.');
}
