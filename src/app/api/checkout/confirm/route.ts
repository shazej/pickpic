import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, sql } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, paymentIntentId, isMock } = await req.json();

        // In a real flow, this might be a webhook, or client-side confirmation.
        // For Mock, we trust the client's call if they have the valid mock ID.

        if (isMock) {
            // Verify order belongs to user
            const orderRes = await query('SELECT * FROM marketplace.Orders WHERE id = @id AND buyer_id = @buyerId', [
                { name: 'id', value: orderId, type: sql.UniqueIdentifier },
                { name: 'buyerId', value: session.user.id, type: sql.UniqueIdentifier }
            ]);

            if (orderRes.recordset.length === 0) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // Update Payments
            await query(`
                UPDATE marketplace.Payments 
                SET status = 'succeeded' 
                WHERE order_id = @orderId AND provider = 'mock'
            `, [
                { name: 'orderId', value: orderId, type: sql.UniqueIdentifier }
            ]);

            // Update Order
            await query(`
                UPDATE marketplace.Orders 
                SET status = 'processing', payment_status = 'paid' 
                WHERE id = @orderId
            `, [
                { name: 'orderId', value: orderId, type: sql.UniqueIdentifier }
            ]);

            // Create Notification
            await query(`
                INSERT INTO notifications.Notifications (user_id, type, title, body, link)
                VALUES (@userId, 'order_update', 'Order Placed', 'Your order has been successfully placed!', @link)
            `, [
                { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier },
                { name: 'link', value: `/orders/${orderId}`, type: sql.NVarChar }
            ]);


            return NextResponse.json({ success: true, status: 'paid' });
        }

        // For Real Stripe, we'd verify the PI status here via SDK or wait for webhook.
        // We'll leave the Webhook to do the heavy lifting for security, this just returns OK.

        return NextResponse.json({ success: true, message: 'Payment confirmed processing' });

    } catch (error) {
        console.error('Confirmation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
