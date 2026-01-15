
import { z } from 'zod';

export const ProductResultSchema = z.object({
    id: z.string(),
    title: z.string(),
    price: z.number(),
    location: z.string(),
    imageUrl: z.string().optional(),
});

export const BuyerSearchSchema = z.object({
    query: z.string().describe('Search query extracted from user'),
    locationFilter: z.string().optional(),
    results: z.array(ProductResultSchema).optional().describe('Found products'),
    message: z.string().describe('Response message to user'),
});

export const SellerListingSchema = z.object({
    productName: z.string().describe('Name of the product'),
    price: z.number().optional().describe('Price in local currency'),
    description: z.string().optional().describe('Short description'),
    location: z.string().optional().describe('City or area'),
    category: z.string().optional().describe('Product category'),
    confidence: z.number().describe('Confidence 0-1 that we have enough info to list'),
    missingFields: z.array(z.string()).describe('List of fields still needed to be asked'),
});

export const IntentSchema = z.object({
    intent: z.enum(['BUY', 'SELL', 'SUPPORT', 'AMBIGUOUS']),
    confidence: z.number().describe('Confidence score 0-1. If unsure, set low.'),
    reasoning: z.string().describe('Why this intent was chosen'),
    // parameters: z.record(z.string()).optional().describe('Extracted entities like product name or price'),
});

export type ProductResult = z.infer<typeof ProductResultSchema>;
export type BuyerSearch = z.infer<typeof BuyerSearchSchema>;
export type SellerListing = z.infer<typeof SellerListingSchema>;
export type Intent = z.infer<typeof IntentSchema>;
