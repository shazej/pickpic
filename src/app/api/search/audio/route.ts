import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';
import { transcribeAndSearch } from '@/ai/flows/multimodal-search';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('audio') as File;

        if (!file) {
            return NextResponse.json({ error: 'No audio file' }, { status: 400 });
        }

        // Convert to base64
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Audio = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Run AI Flow
        const searchIntent = await transcribeAndSearch.run({
            audio_data: base64Audio
        });

        // Search DB (Simple implementation)
        const pool = await getPool();
        const result = await pool.request()
            .input('query', sql.NVarChar, `%${searchIntent.query_text}%`)
            .query(`
                SELECT TOP 10 * FROM products 
                WHERE title LIKE @query OR description LIKE @query
            `);

        // Log Event
        await pool.request()
            .input('query_type', sql.NVarChar, 'audio')
            .input('raw_query', sql.NVarChar(sql.MAX), searchIntent.transcript || '')
            .input('parsed_intent', sql.NVarChar(sql.MAX), JSON.stringify(searchIntent))
            .input('result_count', sql.Int, result.recordset.length)
            .query(`
                INSERT INTO search_events (query_type, raw_query, parsed_intent, result_count)
                VALUES (@query_type, @raw_query, @parsed_intent, @result_count)
            `);

        return NextResponse.json({
            transcript: searchIntent.transcript,
            intent: searchIntent,
            results: result.recordset
        });

    } catch (error: any) {
        console.error('Audio Search Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
