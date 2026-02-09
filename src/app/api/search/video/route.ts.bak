import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';
import { analyzeVideoAndSearch } from '@/ai/flows/multimodal-search';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('video') as File;

        if (!file) {
            return NextResponse.json({ error: 'No video file' }, { status: 400 });
        }

        // Convert to base64 (Note: large videos might fail this simple approach, assumes short clips)
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Video = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Run AI Flow
        const visualDescriptor = await analyzeVideoAndSearch.run({
            video_data: base64Video
        });

        // Construct search query from keywords
        const keywords = visualDescriptor.keywords.join(' ');

        // Search DB
        const pool = await getPool();
        const result = await pool.request()
            .input('query', sql.NVarChar, `%${keywords.replace(/ /g, '%')}%`) // Rough approximation
            .query(`
                SELECT TOP 10 * FROM products 
                WHERE title LIKE @query OR description LIKE @query
            `);

        // Log Event
        await pool.request()
            .input('query_type', sql.NVarChar, 'video')
            .input('raw_query', sql.NVarChar(sql.MAX), 'video_file_upload')
            .input('parsed_intent', sql.NVarChar(sql.MAX), JSON.stringify(visualDescriptor))
            .input('result_count', sql.Int, result.recordset.length)
            .query(`
                INSERT INTO search_events (query_type, raw_query, parsed_intent, result_count)
                VALUES (@query_type, @raw_query, @parsed_intent, @result_count)
            `);

        return NextResponse.json({
            visual_descriptor: visualDescriptor,
            results: result.recordset
        });

    } catch (error: any) {
        console.error('Video Search Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
