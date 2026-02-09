
const { aiEngine } = require('./src/ai/engine/service');

async function testConfig() {
    try {
        console.log("Fetching AI Engine Config...");
        const config = await aiEngine.getConfig();
        console.log("Config:", config);

        console.log("Testing Health Check...");
        const health = await aiEngine.healthCheck();
        console.log("Health:", health);

        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

// Since it's TS, I might need to run it with ts-node or just check the code
// For simplicity, I'll just check if the files exist and are syntactically correct
console.log("Verification script initialized.");
testConfig();
