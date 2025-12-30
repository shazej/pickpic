
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PricingService } from '@/lib/billing/pricing-service';

export async function GET() {
    try {
        const session = await getSession();
        const userId = session?.user?.id || null;

        const { plans, country } = await PricingService.getLocalizedPlans(userId);

        return NextResponse.json({
            plans,
            country: {
                code: country.country_code,
                name: country.country_name,
                multiplier: country.ppp_multiplier,
                currency: country.currency_code
            }
        });

    } catch (error) {
        console.error('Plans API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
