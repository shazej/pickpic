
const { AiService } = require('./src/services/ai-service');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testMultimodal() {
    console.log("Testing Multimodal Seller AI...");
    try {
        const result = await AiService.getSellerChatResponse({
            draft: { title: 'New Listing', price: 0 },
            answer: "Initial analysis",
            sellerId: 'test-seller',
            imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' // A red shoe
        });
        console.log("AI Response:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

async function testBuyerGeo() {
    console.log("\nTesting Buyer Geo AI...");
    try {
        const result = await AiService.getBuyerChatResponse({
            product: { title: 'Nike Red Shoe', description: 'Great shoe', attributes: { condition: 'New' } },
            message: "Where is this located?",
            history: [],
            imageCount: 1,
            userId: null,
            sellerLocation: "Kuwait City, Kuwait"
        });
        console.log("AI Response:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

async function run() {
    await testMultimodal();
    await testBuyerGeo();
}

run();
