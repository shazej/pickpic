
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                // Identify user from metadata (preferred) or client_reference_id
                const userId = session.metadata?.userId || session.client_reference_id;
                const subscriptionId = session.subscription;

                if (userId && subscriptionId) {
                    await query(
                        `INSERT INTO billing.Subscriptions (id, stripe_subscription_id, user_id, status, plan_id, current_period_end) 
                         VALUES (NEWID(), @stripeSubId, @userId, 'active', 2, SYSDATETIMEOFFSET())`,
                        [
                            { name: 'stripeSubId', value: subscriptionId },
                            { name: 'userId', value: userId }
                        ]
                    );

                    // Update customer ID in auth.Users
                    if (session.customer) {
                        try {
                            await query(
                                `UPDATE auth.Users SET stripe_customer_id = @custId WHERE id = @userId`,
                                [
                                    { name: 'custId', value: session.customer },
                                    { name: 'userId', value: userId }
                                ]
                            );
                        } catch (err: any) {
                            // Ignore column missing error if stripe_customer_id doesn't exist yet on auth.Users
                            console.warn("Could not update stripe_customer_id on users table", err.message);
                        }
                    }
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                await query(
                    `UPDATE billing.Subscriptions SET status = 'canceled' WHERE stripe_subscription_id = @id`,
                    [{ name: 'id', value: subscription.id }]
                );
                break;
            }
            case 'invoice.payment_succeeded': {
                // Extend subscription validity
                const invoice = event.data.object as any;
                if (invoice.subscription) {
                    await query(
                        `UPDATE billing.Subscriptions SET status = 'active', current_period_end = DATEADD(month, 1, SYSDATETIMEOFFSET()) WHERE stripe_subscription_id = @id`,
                        [{ name: 'id', value: invoice.subscription }]
                    );
                }
                break;
            }
        }
    } catch (error) {
        console.error('Webhook handler failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
