import { getSession } from "@/lib/auth";
import { query, sql } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || !session.user) return <div>Unauthorized</div>;

    const orderId = params.id;

    // Fetch Order
    const orderRes = await query(`
        SELECT * FROM marketplace.Orders WHERE id = @id AND buyer_id = @userId
    `, [
        { name: 'id', value: orderId, type: sql.UniqueIdentifier },
        { name: 'userId', value: session.user.id, type: sql.UniqueIdentifier }
    ]);

    if (orderRes.recordset.length === 0) return <div>Order not found</div>;

    const order = orderRes.recordset[0];

    // Fetch Items
    const itemsRes = await query(`
        SELECT oi.*, p.title, p.category 
        FROM marketplace.OrderItems oi
        LEFT JOIN marketplace.Products p ON oi.product_id = p.id
        WHERE oi.order_id = @orderId
    `, [{ name: 'orderId', value: orderId, type: sql.UniqueIdentifier }]);

    const items = itemsRes.recordset;

    return (
        <div className="container max-w-4xl py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Order Details</h1>
                <Link href="/orders"><Button variant="outline">Back to My Orders</Button></Link>
            </div>

            {order.payment_status === 'paid' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3 text-green-800">
                    <CheckCircle2 className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">Payment Successful</p>
                        <p className="text-sm">Thank you for your purchase.</p>
                    </div>
                </div>
            )}

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Order ID</p>
                            <p className="font-medium">#{order.id}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">{format(order.created_at, 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Status</p>
                            <Badge className="mt-1">{order.status}</Badge>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-bold text-lg">${order.total_amount.toFixed(2)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Items</h2>
            <div className="space-y-4">
                {items.map((item: any) => (
                    <Card key={item.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium">{item.title || 'Product Unavailable'}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
