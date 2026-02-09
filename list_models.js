
const fs = require('fs');

try {
    // Read using utf16le encoding if coming from powershell redirect
    let content = fs.readFileSync('valid_models.json', 'utf16le');

    // If not valid JSON, try utf8
    try {
        JSON.parse(content);
    } catch (e) {
        content = fs.readFileSync('valid_models.json', 'utf8');
        // Remove possible BOM
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.substr(1);
        }
    }

    const data = JSON.parse(content);
    const geminiModels = data.models
        .filter(m => m.name.includes('gemini'))
        .map(m => m.name);

    console.log("Available Gemini Models:");
    console.log(JSON.stringify(geminiModels, null, 2));
} catch (err) {
    console.error("Error parsing models:", err.message);
}
