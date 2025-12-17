
import { generate } from '@genkit-ai/ai'; // Or mock if not fully set up
// import { gemini15Flash } from '@genkit-ai/google-genai'; // Using Gemini as default
import { z } from 'zod';
import { PROMPTS } from './prompts';
import {
    SearchIntentSchema,
    ExpandQuerySchema,
    NormalizedAttributesSchema,
    RetrievalPlanSchema,
    RerankResultSchema,
    VisualDescriptorSchema,
    ZeroResultsSchema,
    SafetyCheckSchema,
    SqlPlanSchema
} from './schemas';

// --- Helper for Prompt Injection ---
function fillPrompt(template: string, vars: Record<string, any>): string {
    let output = template;
    for (const [key, value] of Object.entries(vars)) {
        output = output.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return output;
}

// --- Genkit Flows ---

// 1. Parse Search Intent
export async function parseSearchIntent(query: string, lat?: number, lng?: number) {
    const prompt = fillPrompt(PROMPTS.PARSE_SEARCH_INTENT, {
        USER_QUERY: query,
        LAT: lat || 'null',
        LNG: lng || 'null'
    });

    // Mock implementation if Genkit env not ready, otherwise standard call:
    /*
    const response = await generate({
        model: gemini15Flash,
        prompt: prompt,
        output: { schema: SearchIntentSchema }
    });
    return response.output();
    */

    // For this demo, since we might not have API keys configured in this environment:
    console.log("[Genkit] Mocking Parse Intent for:", query);
    return {
        query_keywords: query.split(" "),
        must_have: [],
        nice_to_have: [],
        category: null,
        condition: null,
        price_min: null,
        price_max: null,
        currency: 'USD',
        brand: null,
        color: null,
        size: null,
        material: null,
        distance_km: null,
        sort: 'relevance',
        negatives: [],
        rewrite_query: query
    }; // Return mock adhering to schema
}

// 2. Expand Query
export async function expandQuery(query: string, category: string | null = null) {
    const prompt = fillPrompt(PROMPTS.EXPAND_QUERY, {
        USER_QUERY: query,
        CATEGORY_OR_NULL: category || 'null'
    });
    // Mock
    return {
        expanded_terms: [query, query + "s"],
        synonyms: [],
        common_misspellings: [],
        brand_normalizations: [],
        negative_terms: []
    };
}

// 3. Normalize Attributes
export async function normalizeAttributes(title: string, description: string, attributes: any) {
    const prompt = fillPrompt(PROMPTS.NORMALIZE_ATTRIBUTES, {
        TITLE: title,
        DESCRIPTION: description,
        ATTRIBUTES_JSON: JSON.stringify(attributes)
    });
    // Mock
    return {
        normalized: {
            category: "General",
            sub_category: null,
            brand: null,
            model: null,
            color: [],
            size: null,
            material: [],
            condition: null,
            tags: [],
            key_features: [],
            search_boost_terms: []
        },
        quality_warnings: []
    };
}

// 4. Retrieval Planner
export async function planRetrieval(query: string, hasImage: boolean, filters: any, lat?: number, lng?: number) {
    const prompt = fillPrompt(PROMPTS.RETRIEVAL_PLAN, {
        USER_QUERY_OR_EMPTY: query || '',
        TRUE_FALSE: hasImage,
        FILTERS_JSON: JSON.stringify(filters),
        LAT_LNG_OR_NULL: lat && lng ? `${lat},${lng}` : 'null'
    });
    // Mock
    return {
        mode: hasImage ? 'hybrid' : 'text_only',
        steps: [{ name: 'db_search', description: 'Search database' }],
        candidate_limits: { text_candidates: 50, image_candidates: 50, final_results: 20 },
        ranking_strategy: 'hybrid_weighted',
        hybrid_weights: { text: 0.7, image: 0.3, geo: 0, freshness: 0 },
        explanation: "Standard retrieval plan."
    };
}

// 5. Re-ranker
export async function rerankCandidates(query: string, filters: any, candidates: any[]) {
    const prompt = fillPrompt(PROMPTS.RERANKER, {
        USER_QUERY: query,
        FILTERS_JSON: JSON.stringify(filters),
        CANDIDATES_JSON: JSON.stringify(candidates)
    });
    // Mock
    return {
        ranked: candidates.map(c => ({
            product_id: c.id || c.product_id,
            final_score: 1.0,
            match_reasons: ['Exact match'],
            mismatch_warnings: []
        })),
        did_apply_filters: true,
        suggested_filters: { category: null, price_max: null, condition: null, distance_km: null }
    };
}

// 6. Visual Descriptor (Image Analysis)
export async function getVisualDescriptor(imageUrl: string) {
    // Ideally pass image bytes or URL to multimodal prompt
    // Mock
    return {
        visual_category: "Unknown",
        visual_keywords: ["object"],
        likely_attributes: { color: [], material: [], pattern: null, style: null, shape: null },
        avoid_terms: [],
        confidence_notes: ["Mock analysis"]
    };
}

// 7. Zero Results
export async function zeroResultsRecovery(query: string, filters: any, count: number) {
    const prompt = fillPrompt(PROMPTS.ZERO_RESULTS, {
        USER_QUERY: query,
        FILTERS_JSON: JSON.stringify(filters),
        N: count
    });
    // Mock
    return {
        message: "No results found.",
        relaxations: [],
        alternative_queries: ["generic query"],
        related_categories: []
    };
}

// 8. Safety Check
export async function safetyCheck(query: string) {
    const prompt = fillPrompt(PROMPTS.SAFETY_CHECK, {
        USER_QUERY: query
    });
    // Mock
    return {
        allowed: true,
        blocked_reason: null,
        safe_rewrite: null,
        category_flags: []
    };
}

// 9. SQL Plan
export async function planSqlQuery(filters: any) {
    const prompt = fillPrompt(PROMPTS.SQL_PLAN, {
        FILTERS_JSON: JSON.stringify(filters)
    });
    // Mock
    return {
        where: [],
        order_by: [{ field: 'created_at', direction: 'desc' }],
        limit: 20,
        offset: 0
    };
}
