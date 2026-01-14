
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { semanticRouter } from '@/ai/router';
import { sellerFlow } from '@/ai/flows/seller';
import { buyerFlow } from '@/ai/flows/buyer';

export const maxDuration = 60; // Allow longer timeout for AI

export async function POST(request: Request) {
    try {
        let session;
        try {
            session = await getSession();
        } catch (authError) {
            // Anon allow
        }

        const body = await request.json();
        const { message, history } = body;
        // Note: 'image' support temporarily paused for text-first router validation 

        // 1. Semantic Routing
        console.log('[HybridUI] Routing intent for:', message);
        const route = await semanticRouter({ message });
        const intent = route.intent;
        console.log('[HybridUI] Intent:', intent);

        let responseData: any = {
            reply: "I'm not sure how to help with that yet.",
            type: 'text',
            data: null
        };

        // 2. Specialized Logic
        if (intent === 'BUY') {
            const result = await buyerFlow({ message });
            responseData = {
                reply: result.message,
                type: 'buyer_search',
                data: result
            };
        } else if (intent === 'SELL') {
            const contextHistory = history || [];
            // Pass history to seller flow for multi-turn extraction
            const result = await sellerFlow({ message, history: contextHistory });

            // Check if draft is ready or if we need to ask more questions
            const isReady = result.confidence > 0.8 && result.missingFields.length === 0;

            if (isReady) {
                responseData = {
                    reply: "I've drafted a listing for you. Please confirm the details below.",
                    type: 'seller_draft',
                    data: result
                };
            } else {
                // Generate a follow-up question based on missing fields
                // For MVP, we'll just ask generically or list missing fields in text
                const missing = result.missingFields.join(', ');
                responseData = {
                    reply: `I can help you list this. I still need to know: ${missing}.`,
                    type: 'seller_draft', // Show partial draft
                    data: result
                };
            }

        } else if (intent === 'SUPPORT') {
            responseData = {
                reply: "Please contact support@kechiki.com for assistance.",
                type: 'text',
                data: null
            };
        } else {
            // AMBIGUOUS or CHAT
            responseData = {
                reply: "Could you clarify if you want to buy something or sell something?",
                type: 'text',
                data: null
            };
        }

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("Hybrid Chat Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
