
import { z } from 'zod';

// Prompt 1: Parse Search Intent
export const SearchIntentSchema = z.object({
    query_keywords: z.array(z.string()),
    must_have: z.array(z.string()),
    nice_to_have: z.array(z.string()),
    category: z.string().nullable(),
    condition: z.enum(['new', 'like_new', 'used', 'for_parts']).nullable(),
    price_min: z.number().nullable(),
    price_max: z.number().nullable(),
    currency: z.string().nullable(),
    brand: z.string().nullable(),
    color: z.string().nullable(),
    size: z.string().nullable(),
    material: z.string().nullable(),
    distance_km: z.number().nullable(),
    sort: z.enum(['relevance', 'price_low', 'price_high', 'distance', 'newest']),
    negatives: z.array(z.string()),
    rewrite_query: z.string()
});

// Prompt 2: Expand Query
export const ExpandQuerySchema = z.object({
    expanded_terms: z.array(z.string()),
    synonyms: z.array(z.string()),
    common_misspellings: z.array(z.string()),
    brand_normalizations: z.array(z.object({
        input: z.string(),
        normalized: z.string()
    })),
    negative_terms: z.array(z.string())
});

// Prompt 3: Normalize Attributes
export const NormalizedAttributesSchema = z.object({
    normalized: z.object({
        category: z.string().nullable(),
        sub_category: z.string().nullable(),
        brand: z.string().nullable(),
        model: z.string().nullable(),
        color: z.array(z.string()),
        size: z.string().nullable(),
        material: z.array(z.string()),
        condition: z.enum(['new', 'like_new', 'used', 'for_parts']).nullable(),
        tags: z.array(z.string()),
        key_features: z.array(z.string()),
        search_boost_terms: z.array(z.string())
    }),
    quality_warnings: z.array(z.string())
});

// Prompt 4: Retrieval Planner
export const RetrievalPlanSchema = z.object({
    mode: z.enum(['text_only', 'image_only', 'hybrid']),
    steps: z.array(z.object({
        name: z.string(),
        description: z.string()
    })),
    candidate_limits: z.object({
        text_candidates: z.number(),
        image_candidates: z.number(),
        final_results: z.number()
    }),
    ranking_strategy: z.enum(['hybrid_weighted', 'image_primary', 'text_primary']),
    hybrid_weights: z.object({
        text: z.number(),
        image: z.number(),
        geo: z.number(),
        freshness: z.number()
    }),
    explanation: z.string()
});

// Prompt 5: Re-ranker
export const RerankResultSchema = z.object({
    ranked: z.array(z.object({
        product_id: z.string(),
        final_score: z.number(),
        match_reasons: z.array(z.string()),
        mismatch_warnings: z.array(z.string())
    })),
    did_apply_filters: z.boolean(),
    suggested_filters: z.object({
        category: z.string().nullable(),
        price_max: z.number().nullable(),
        condition: z.string().nullable(),
        distance_km: z.number().nullable()
    })
});

// Prompt 6: Visual Descriptor
export const VisualDescriptorSchema = z.object({
    visual_category: z.string().nullable(),
    visual_keywords: z.array(z.string()),
    likely_attributes: z.object({
        color: z.array(z.string()),
        material: z.array(z.string()),
        pattern: z.string().nullable(),
        style: z.string().nullable(),
        shape: z.string().nullable()
    }),
    avoid_terms: z.array(z.string()),
    confidence_notes: z.array(z.string())
});

// Prompt 7: Zero Results Recovery
export const ZeroResultsSchema = z.object({
    message: z.string(),
    relaxations: z.array(z.object({
        filter: z.string(),
        suggested_change: z.string(),
        reason: z.string()
    })),
    alternative_queries: z.array(z.string()),
    related_categories: z.array(z.string())
});

// Prompt 8: Safety Check
export const SafetyCheckSchema = z.object({
    allowed: z.boolean(),
    blocked_reason: z.string().nullable(),
    safe_rewrite: z.string().nullable(),
    category_flags: z.array(z.string())
});

// Prompt 9: SQL Plan
export const SqlPlanSchema = z.object({
    where: z.array(z.object({
        field: z.string(),
        op: z.enum(['eq', 'like', 'gte', 'lte', 'in', 'contains_json']),
        value: z.any()
    })),
    order_by: z.array(z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc'])
    })),
    limit: z.number(),
    offset: z.number()
});

// Prompt 10: Buyer Chatbot
export const BuyerChatResponseSchema = z.object({
    reply: z.string(),
    citations: z.array(z.object({
        type: z.enum(['attribute', 'listing', 'image', 'policy']),
        ref: z.string()
    })),
    suggested_questions: z.array(z.string()),
    safety_notes: z.array(z.string()).optional()
});

// Prompt 11: Seller Chatbot
export const SellerChatResponseSchema = z.object({
    updated_fields: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        currency: z.string().optional(),
        category: z.string().optional(),
        condition: z.string().optional(),
        attributes: z.record(z.any()).optional()
    }).optional(),
    next_question: z.object({
        question_key: z.string(),
        question_text: z.string(),
        suggestions: z.array(z.string()).optional()
    }).nullable(),
    progress: z.object({
        required_complete: z.boolean(),
        missing: z.array(z.string())
    }),
    feedback: z.string().optional(),
    suggestions: z.array(z.string()).optional()
});

// Mandatory PickPic Response Schema
export const PickPicResponseSchema = z.object({
    intent: z.enum(['search', 'list', 'compare', 'clarify', 'no_match']),
    confidence: z.number().min(0).max(1),
    clarifying_question: z.string().nullable(),
    listing_fields: z.object({
        category: z.string().nullable(),
        brand: z.string().nullable(),
        model: z.string().nullable(),
        condition: z.enum(['new', 'used', 'refurbished']).nullable(),
        color: z.string().nullable(),
        size: z.string().nullable(),
        material: z.string().nullable(),
        price_suggestion: z.number().nullable(),
        tags: z.array(z.string())
    }).nullable(),
    matched_products: z.array(z.object({
        product_id: z.string(),
        reason: z.string()
    })),
    response_text: z.string()
});

export type PickPicResponse = z.infer<typeof PickPicResponseSchema>;
