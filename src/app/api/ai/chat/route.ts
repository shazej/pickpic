
import { NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AiService } from '@/services/ai-service';
import { isRateLimited } from '@/lib/rate-limiter';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: { responseMimeType: "application/json" }
    });

    try {
        let session;
        try {
            session = await getSession();
        } catch (authError) {
            console.error("[AI] Session retrieval failed:", authError);
            // Non-blocking for anon chat
        }

        const userId = session?.user?.id || null;

        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error("[AI] Request parsing failed:", e);
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { message, history, image } = body;

        const prompt = `
            You are sale chat AI, a premium conversational assistant.
            You help users find products, sell items, or just chat.
            
            Context: The user is in a unified chat interface.
            History: ${JSON.stringify(history || [])}
            User Message: ${message}
            
            If the user wants to SELL: guide them to provide details.
            If the user wants to BUY: search the marketplace (simulated for now).
            
            Return a JSON response with:
            {
                "reply": "your message",
                "suggestions": ["next question?", "show me more"],
                "action": "none" | "list_item" | "search_items"
            }
        `;

        let contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
        if (image) {
            const base64Data = image.split(',')[1] || image;
            contents[0].parts.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data
                }
            });
        }

        console.log("[AI] Calling gemini-flash-latest...");
        const result = await model.generateContent({ contents });
        const response = await result.response;
        const data = JSON.parse(response.text());

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Unified Chat Error (Detailed):", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
