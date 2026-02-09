const https = require("https");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
dotenv.config({ path: ".env.local" });

const key = process.env.GOOGLE_GENAI_API_KEY;

function listModels() {
    console.log("Listing models with key:", key ? key.substring(0, 10) + "..." : "MISSING");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    if (json.models) {
                        console.log("AVAILABLE MODELS:");
                        json.models.forEach(m => console.log(" - " + m.name));
                    } else {
                        console.log("No models found:", data);
                    }
                } catch (e) {
                    console.error("Parse error:", e.message);
                }
                resolve();
            });
        }).on("error", (e) => {
            console.error("Error:", e.message);
            resolve();
        });
    });
}

async function testGeminiFlash() {
    try {
        console.log("Testing gemini-flash-latest...");
        const genAI = new GoogleGenerativeAI(key || "");
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello, are you working?");
        console.log("Response (gemini-flash-latest):", result.response.text());
    } catch (e) {
        console.error("gemini-flash-latest FAILED:", e.message);
    }
}

async function run() {
    await listModels();
    await testGeminiFlash();
}

run();
