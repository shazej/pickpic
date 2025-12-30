"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/cart-context";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm, MockCheckoutForm } from "@/components/checkout-form";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Initialize Stripe outside component
// If key is missing, we handle gracefully (Mock mode passed from server)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

export default function CheckoutPage() {
    const { items, total } = useCart();
    const [clientSecret, setClientSecret] = useState("");
    const [orderId, setOrderId] = useState("");
    const [isMock, setIsMock] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (items.length === 0) return;

        // Create Intent on mount
        const createIntent = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/checkout/create-intent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
                    }),
                });
                const data = await res.json();
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                    setOrderId(data.orderId);
                    setIsMock(data.isMock);
                } else if (data.error === 'Unauthorized') {
                    router.push('/login?redirect=/checkout');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        createIntent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (items.length === 0) {
        return <div className="p-10 text-center">Your cart is empty.</div>;
    }

    return (
        <div className="container max-w-4xl py-10">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Order Summary */}
                <div className="bg-muted/30 p-6 rounded-lg h-fit">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.productId} className="flex justify-between items-center text-sm">
                                <span>{item.title} (x{item.quantity})</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t pt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                    ) : isMock ? (
                        <MockCheckoutForm orderId={orderId} />
                    ) : clientSecret && stripePromise ? (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: { theme: 'stripe' },
                                // In mock mode, we don't strictly need stripe object if using mock flow component logic,
                                // but Elements provider expects it. 
                                // If mock, we might skip Elements or pass null.
                                // However, the CheckoutForm logic handles isMock.
                                // If stripePromise is null (no key), Elements throws.
                            }}
                        >
                            <CheckoutForm orderId={orderId} clientSecret={clientSecret} />
                        </Elements>
                    ) : (
                        <div>Failed to initialize checkout. (Missing Keys?)</div>
                    )}
                </div>
            </div>
        </div>
    );
}
