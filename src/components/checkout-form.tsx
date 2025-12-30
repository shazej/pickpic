"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function MockCheckoutForm({ orderId }: { orderId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleMockPay = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/checkout/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, isMock: true })
            });

            if (res.ok) {
                toast({ title: "Payment Successful", description: "Your mock order has been placed." });
                router.push(`/orders/${orderId}`); // Redirect to order details
            } else {
                throw new Error("Mock payment failed");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Payment Failed" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleMockPay} className="space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                <strong>Mock Mode:</strong> No real payment will be processed. Click "Pay Now" to simulate success.
            </div>
            <Button disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Pay Now (Mock)"}
            </Button>
        </form>
    );
}

export function CheckoutForm({ orderId, clientSecret }: { orderId: string, clientSecret: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/orders/${orderId}`,
            },
        });

        if (error) {
            toast({ variant: "destructive", title: "Payment Failed", description: error.message });
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            <Button disabled={!stripe || isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Pay Now"}
            </Button>
        </form>
    );
}
