import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-defining schema for test (or export from file)
const ListingStateSchema = z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    condition: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().optional(),
    description: z.string().optional(),
    attributes: z.record(z.string(), z.any()).optional(),
    images: z.array(z.string()).optional(),
});

describe('Listing Assistant Logic', () => {
    it('should validate a valid partial state', () => {
        const state = {
            title: "Test Product",
            category: "Electronics"
        };
        const result = ListingStateSchema.safeParse(state);
        expect(result.success).toBe(true);
    });

    it('should allow empty state', () => {
        const result = ListingStateSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('should invalid type for price', () => {
        const state = {
            price: "100" // String instead of number
        };
        const result = ListingStateSchema.safeParse(state);
        expect(result.success).toBe(false);
    });
});
