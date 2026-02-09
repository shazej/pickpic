
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.production" });

const key = process.env.GOOGLE_GENAI_API_KEY;

async function testPrompt() {
    console.log("Testing Prompt with key:", key ? "OK" : "MISSING");
    const genAI = new GoogleGenerativeAI(key || "");
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
System prompt: You are a shopping assistant.
Product: Nike Shoes. Location: Kuwait.
User: Where are you?
Return JSON: { "reply": "string", "citations": [], "suggested_questions": [] }
`;

    try {
        const result = await model.generateContent(prompt);
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("FAILED:", e.message);
    }
}

testPrompt();
