import '../src/polyfill';
// import { startFlow } from '@genkit-ai/flow'; // Unused
import { semanticRouter } from '../src/ai/router';
import { sellerFlow } from '../src/ai/flows/seller';
import { buyerFlow } from '../src/ai/flows/buyer';
import { requireCredits } from '../src/ai/middleware/auth';

async function runVerification() {
    console.log('--- Starting Hybrid UI Verification ---');

    try {
        // 1. Test Semantic Router
        console.log('\n[1] Testing Semantic Router...');
        const sellIntent = await semanticRouter({ message: 'I want to sell my old bike' });
        console.log('Result (Sell):', sellIntent.intent === 'SELL' ? 'PASSED' : 'FAILED', sellIntent);

        const buyIntent = await semanticRouter({ message: 'Looking for a cheap camera' });
        console.log('Result (Buy):', buyIntent.intent === 'BUY' ? 'PASSED' : 'FAILED', buyIntent);


        // 2. Test Seller Flow
        console.log('\n[2] Testing Seller Flow (Extraction)...');
        const sellerResult = await sellerFlow({ message: 'It is a specialized road bike, asking $500, located in Berlin' });
        console.log('Result:', sellerResult.productName ? 'PASSED' : 'FAILED');
        console.log('Extracted:', {
            product: sellerResult.productName,
            price: sellerResult.price,
            location: sellerResult.location
        });

        // 3. Test Buyer Flow (Mock RAG)
        console.log('\n[3] Testing Buyer Flow (Generative UI)...');
        const buyerResult = await buyerFlow({ message: 'Vintage lamp' });
        console.log('Result:', buyerResult.results?.length === 3 ? 'PASSED' : 'FAILED');
        console.log('Generated UI Data:', buyerResult.results?.[0]);


        // 4. Test Middleware (Mock)
        console.log('\n[4] Testing Middleware...');
        const check = requireCredits(1);
        const mockContext = { auth: { credits: 5, role: 'buyer' } };
        try {
            await check('input', mockContext);
            console.log('Credit Check (Sufficient): PASSED');
        } catch (e) {
            console.log('Credit Check (Sufficient): FAILED', e);
        }

        try {
            await check('input', { auth: { credits: 0 } });
            console.log('Credit Check (Insufficient): FAILED (Should have thrown)');
        } catch (e: any) {
            console.log('Credit Check (Insufficient): PASSED (Caught Expected Error)');
        }


    } catch (error) {
        console.error('Verification FAILED:', error);
        process.exit(1);
    }

    console.log('\n--- Verification Complete ---');
}

runVerification();
