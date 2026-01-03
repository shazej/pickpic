import Stripe from 'stripe';

const getStripe = () => {
    const apiKey = process.env.STRIPE_SECRET_KEY;

    // Fallback for build phase or missing keys during demo setup
    if (!apiKey || process.env.NEXT_PHASE === 'phase-production-build') {
        return {
            checkout: {
                sessions: {
                    create: async () => ({ url: '#' }),
                }
            },
            webhooks: {
                constructEvent: () => ({ type: 'ignored' }),
            }
        } as any;
    }

    return new Stripe(apiKey, {
        apiVersion: '2024-11-20.acacia',
        typescript: true,
    });
};

export const stripe = getStripe();
