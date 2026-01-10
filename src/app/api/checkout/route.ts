
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Assuming auth is available like middleware
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user || !user.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { planId = 'premium' } = body;

        // 1. Create Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Kechiki Premium',
                            description: 'Unlock unlimited AI generations and advanced tools.',
                        },
                        unit_amount: 2900, // $29.00
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id as string,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('[STRIPE_CHECKOUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
