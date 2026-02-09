import { z } from 'zod';
import { GenkitError } from '@genkit-ai/core';

// Mock user context type - in real app would come from session
type UserContext = {
    id: string;
    credits: number;
    role: 'buyer' | 'seller';
};

/**
 * Middleware factory that creates a validation function for tools/flows.
 * @param requiredCredits Number of credits needed to execute the action
 */
export function requireCredits(requiredCredits: number) {
    return async (input: any, context: any) => {
        // Context is passed from the runFlow/runTool execution
        const user = context?.auth as UserContext;

        if (!user) {
            throw new GenkitError({
                status: 'PERMISSION_DENIED',
                message: 'Authentication required to perform this action.',
            });
        }

        if (user.credits < requiredCredits) {
            throw new GenkitError({
                status: 'RESOURCE_EXHAUSTED',
                message: 'Insufficient credits. Please top up your wallet.',
                details: {
                    required: requiredCredits,
                    current: user.credits
                }
            });
        }

        // Pass through if valid
        return input;
    };
}

/**
 * Helper to check credits without throwing (for conditional UI rendering)
 */
export function hasCredits(context: any, required: number): boolean {
    const user = context?.auth as UserContext;
    return !!user && user.credits >= required;
}
