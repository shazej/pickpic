
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const API_KEY = "AIzaSyBiWaqJFn1uKNwCUG0GGlNYgd57IRvtwBM";

async function testKey() {
    console.log("Testing API Key:", API_KEY);
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = "Explain how AI works in one sentence.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:", text);
        fs.writeFileSync('error_log.txt', "SUCCESS: " + text);
    } catch (error) {
        console.error("Error testing key:");
        console.error(error.message);
        let errorLog = error.message;
        if (error.response) {
            const details = JSON.stringify(error.response, null, 2);
            console.error("Response details:", details);
            errorLog += "\n" + details;
        }
        fs.writeFileSync('error_log.txt', errorLog);
    }
}

testKey();
