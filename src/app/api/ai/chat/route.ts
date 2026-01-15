
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
        const { message, history, language = 'ar' } = body;

        console.log('[HybridUI] Routing intent for:', message, 'Lang:', language);
        const route = await semanticRouter({ message });
        const intent = route.intent;
        console.log('[HybridUI] Intent:', intent, 'Confidence:', route.confidence);

        const isAr = language === 'ar';

        let responseData: any = {
            reply: isAr ? "عذراً، لم أفهم طلبك تماماً." : "Sorry, I didn't quite get that.",
            type: 'text',
            data: null
        };

        // Clarification Logic for Low Confidence or Ambiguous
        if (intent === 'AMBIGUOUS' || (route.confidence !== undefined && route.confidence < 0.6)) {
            responseData = {
                reply: isAr
                    ? `لست متأكداً، هل تريد شراء أم بيع "${message}"؟`
                    : `I'm not sure. Do you want to BUY or SELL "${message}"?`,
                type: 'clarification',
                data: {
                    options: [
                        {
                            label: isAr ? `أريد شراء ${message}` : `I want to buy ${message}`,
                            value: isAr ? `أريد شراء ${message}` : `I want to buy ${message}`
                        },
                        {
                            label: isAr ? `أريد بيع ${message}` : `I want to sell ${message}`,
                            value: isAr ? `أريد بيع ${message}` : `I want to sell ${message}`
                        }
                    ]
                }
            };
        } else if (intent === 'BUY') {
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
                    reply: isAr
                        ? "لقد قمت بتجهيز مسودة الإعلان. يرجى تأكيد التفاصيل أدناه."
                        : "I've prepared a draft listing. Please confirm the details below.",
                    type: 'seller_draft',
                    data: result
                };
            } else {
                const missing = result.missingFields.join(isAr ? '، ' : ', ');
                responseData = {
                    reply: isAr
                        ? `يمكنني مساعدتك في عرض هذا للبيع. أحتاج لمعرفة: ${missing}.`
                        : `I can help you list this. I need to know: ${missing}.`,
                    type: 'seller_draft', // Show partial draft
                    data: result
                };
            }

        } else if (intent === 'SUPPORT') {
            responseData = {
                reply: isAr
                    ? "يرجى التواصل مع الدعم الفني support@kechiki.com للمساعدة."
                    : "Please contact support@kechiki.com for help.",
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
