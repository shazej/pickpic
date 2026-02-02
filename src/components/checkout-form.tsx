"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function MockCheckoutForm({ orderId }: { orderId: string }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast({
            title: "Payment Successful",
            description: `Order ${orderId} confirmed!`,
        });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Mock Payment Gateway</p>
            <Button onClick={handlePayment} disabled={loading} className="w-full">
                {loading ? "Processing..." : "Pay Now"}
            </Button>
        </div>
    );
}
