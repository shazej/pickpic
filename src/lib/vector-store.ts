
import { sql } from 'mssql'; // Note: Ensure mssql is configured/available or pass pool
// For MVP without external vector DB, we can store vectors in SQL (JSON/Binary) and do in-memory cosine similarity 
// OR use a dedicated table if we had pgvector. Since we are on SQL Server, we will stick to a simple approach:
// 1. Store embedding in 'listings' table (as JSON string or separate table).
// 2. Fetch all active listing embeddings (caching them).
// 3. Perform cosine similarity in Node.js.
// This is scalable enough for < 10k items for a demo.

export async function saveEmbedding(listingId: string, embedding: number[]) {
    // Save to the listings table
    // embedding is array of numbers. float[].
    const embeddingJson = JSON.stringify(embedding);
    // Assuming we have a global pool or we create one. 
    // Ideally this should use the centralized db connection.
    // For now, I'll return the SQL needed or assume a db helper exists.
    return { listingId, embeddingJson };
}

// Cosine similarity helper
export function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export type ScoredListing = {
    id: string;
    score: number;
}

export function searchVectors(queryVector: number[], allVectors: { id: string, embedding: number[] }[], topK: number = 20): ScoredListing[] {
    const scores = allVectors.map(vec => ({
        id: vec.id,
        score: cosineSimilarity(queryVector, vec.embedding)
    }));

    // Sort descending
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK);
}
