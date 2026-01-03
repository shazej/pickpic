
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { query, sql } from '@/lib/db';
import { PricingService } from '@/lib/billing/pricing-service';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId } = await request.json();

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        // 1. Fetch user country
        const userRes = await query('SELECT country_code FROM auth.Users WHERE id = @id', [
            { name: 'id', value: session.user.id, type: sql.UniqueIdentifier }
        ]);
        const countryCode = userRes.recordset[0]?.country_code || 'US';
        const countryInfo = await PricingService.getCountryInfo(countryCode);

        // 2. Fetch plan details
        const planRes = await query('SELECT * FROM billing.Plans WHERE id = @id', [
            { name: 'id', value: planId, type: sql.Int }
        ]);

        if (planRes.recordset.length === 0) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const plan = planRes.recordset[0];
        const baseAmount = parseFloat(plan.amount);

        // 3. Handle Free Plan
        if (baseAmount === 0) {
            return NextResponse.json({ error: 'Free plan cannot be checked out via Stripe' }, { status: 400 });
        }

        // 4. Calculate localized price
        const localizedAmount = PricingService.calculateLocalizedPrice(baseAmount, countryInfo);

        // 5. Create Stripe Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: countryInfo.currency_code.toLowerCase(),
                        product_data: {
                            name: `${plan.name} Plan`,
                            description: `PickPic ${plan.name} Subscription - Adjusted for ${countryInfo.country_name}`,
                        },
                        unit_amount: Math.round(localizedAmount * 100), // Stripe expects cents/intervals
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4500'}/account/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4500'}/account/billing?canceled=true`,
            customer_email: session.user.email,
            metadata: {
                userId: session.user.id,
                planId: plan.id,
                baseAmount: baseAmount.toString(),
                pppMultiplier: countryInfo.ppp_multiplier.toString(),
                finalAmount: localizedAmount.toString(),
                currency: countryInfo.currency_code,
                countryCode: countryInfo.country_code
            },
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error: any) {
        console.error('Checkout API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
