
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query, sql } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('Missing Webhook Secret');
        }
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && planId) {
            console.log(`Checkout completed for User ${userId}, Plan ${planId}`);

            // 1. Get Plan Details (to set limits or just link)
            const planRes = await query('SELECT * FROM billing.Plans WHERE id = @id', [
                { name: 'id', value: parseInt(planId), type: sql.Int }
            ]);

            if (planRes.recordset.length > 0) {
                // 2. Check if subscription already exists
                const subRes = await query('SELECT id FROM billing.Subscriptions WHERE user_id = @userId', [
                    { name: 'userId', value: userId, type: sql.UniqueIdentifier }
                ]);

                const subId = session.subscription as string;
                const expiration = new Date();
                expiration.setMonth(expiration.getMonth() + 1);

                // PPP Pricing Info from metadata
                const baseAmount = session.metadata?.baseAmount ? parseFloat(session.metadata.baseAmount) : null;
                const pppMultiplier = session.metadata?.pppMultiplier ? parseFloat(session.metadata.pppMultiplier) : null;
                const finalAmount = session.metadata?.finalAmount ? parseFloat(session.metadata.finalAmount) : null;
                const currency = session.metadata?.currency || null;

                if (subRes.recordset.length > 0) {
                    // Update
                    await query(`
                        UPDATE billing.Subscriptions 
                        SET plan_id = @planId, 
                            stripe_subscription_id = @subId,
                            status = 'active',
                            current_period_end = @expiry,
                            base_amount = @baseAmount,
                            ppp_multiplier = @pppMultiplier,
                            final_amount = @finalAmount,
                            currency = @currency,
                            updated_at = SYSDATETIME()
                        WHERE user_id = @userId
                    `, [
                        { name: 'planId', value: parseInt(planId), type: sql.Int },
                        { name: 'subId', value: subId, type: sql.NVarChar },
                        { name: 'expiry', value: expiration, type: sql.DateTime2 },
                        { name: 'baseAmount', value: baseAmount, type: sql.Decimal(18, 2) },
                        { name: 'pppMultiplier', value: pppMultiplier, type: sql.Decimal(5, 2) },
                        { name: 'finalAmount', value: finalAmount, type: sql.Decimal(18, 2) },
                        { name: 'currency', value: currency, type: sql.Char(3) },
                        { name: 'userId', value: userId, type: sql.UniqueIdentifier }
                    ]);
                } else {
                    // Insert
                    await query(`
                        INSERT INTO billing.Subscriptions (user_id, plan_id, stripe_subscription_id, status, current_period_end, base_amount, ppp_multiplier, final_amount, currency)
                        VALUES (@userId, @planId, @subId, 'active', @expiry, @baseAmount, @pppMultiplier, @finalAmount, @currency)
                    `, [
                        { name: 'userId', value: userId, type: sql.UniqueIdentifier },
                        { name: 'planId', value: parseInt(planId), type: sql.Int },
                        { name: 'subId', value: subId, type: sql.NVarChar },
                        { name: 'expiry', value: expiration, type: sql.DateTime2 },
                        { name: 'baseAmount', value: baseAmount, type: sql.Decimal(18, 2) },
                        { name: 'pppMultiplier', value: pppMultiplier, type: sql.Decimal(5, 2) },
                        { name: 'finalAmount', value: finalAmount, type: sql.Decimal(18, 2) },
                        { name: 'currency', value: currency, type: sql.Char(3) }
                    ]);
                }

                // 3. Notify User
                await query(`
                    INSERT INTO notifications.Notifications (user_id, type, title, body, link)
                    VALUES (@userId, 'billing', 'Subscription Activated', 'Your Professional plan is now active!', '/account/billing')
                `, [
                    { name: 'userId', value: userId, type: sql.UniqueIdentifier }
                ]);
            }
        }
    }

    return NextResponse.json({ received: true });
}
