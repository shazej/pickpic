
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
                // Identify user from metadata or client_reference_id
                const userId = session.metadata?.userId || session.client_reference_id;
                const subscriptionId = session.subscription;

                if (userId && subscriptionId) {
                    await query(
                        `INSERT INTO subscriptions (id, user_id, status, plan_id, current_period_end) 
                         VALUES (@id, @userId, 'active', @planId, SYSDATETIMEOFFSET())`, // Simplified end date for now, ideally fetch sub details
                        [
                            { name: 'id', value: subscriptionId },
                            { name: 'userId', value: userId },
                            { name: 'planId', value: 'premium' } // or fetch from line items
                        ]
                    );

                    // Also update customer ID in users table if implemented
                    await query(
                        `UPDATE users SET stripe_customer_id = @custId WHERE id = @userId`,
                        [
                            { name: 'custId', value: session.customer },
                            { name: 'userId', value: userId }
                        ]
                    );
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any;
                await query(
                    `UPDATE subscriptions SET status = 'canceled' WHERE id = @id`,
                    [{ name: 'id', value: subscription.id }]
                );
                break;
            }
            case 'invoice.payment_succeeded': {
                // Extend subscription validity
                const invoice = event.data.object as any;
                if (invoice.subscription) {
                    await query(
                        `UPDATE subscriptions SET status = 'active', current_period_end = DATEADD(month, 1, SYSDATETIMEOFFSET()) WHERE id = @id`,
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
