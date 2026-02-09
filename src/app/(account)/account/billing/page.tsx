
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, CreditCard } from "lucide-react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useToast } from "@/hooks/use-toast";

export default function BillingPage() {
    const [usage, setUsage] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<any>(null);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upgradingId, setUpgradingId] = useState<number | null>(null);
    const { toast } = useToast();

    const [country, setCountry] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usageRes, plansRes, subRes] = await Promise.all([
                    fetch('/api/user/usage').then(r => r.json()),
                    fetch('/api/billing/plans').then(r => r.json()),
                    fetch('/api/billing/subscription').then(r => r.json())
                ]);

                if (usageRes.usage) setUsage(usageRes.usage);
                if (plansRes.plans) setPlans(plansRes.plans);
                if (plansRes.country) setCountry(plansRes.country);
                if (subRes.plan) {
                    setCurrentPlan(subRes.plan);
                    setSubscription(subRes.subscription);
                }
            } catch (error) {
                console.error("Failed to fetch billing data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpgrade = async (planId: number) => {
        setUpgradingId(planId);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast({ variant: "destructive", title: "Checkout Error", description: data.error || "Failed to start checkout session." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
        } finally {
            setUpgradingId(null);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="container py-8 max-w-6xl">
                    <div className="flex h-[400px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const limits = currentPlan || { listings_limit: 5, ai_scans_limit: 50 };

    return (
        <ProtectedRoute>
            <div className="container py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-8">
                    <AccountSidebar />

                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
                            <p className="text-muted-foreground">Manage your subscription and monitor your account limits.</p>
                        </div>

                        {/* Usage Stats (Quota) */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>Current Plan: {currentPlan?.name || 'Free'}</CardTitle>
                                            <CardDescription>
                                                {subscription ? `Active until ${new Date(subscription.current_period_end).toLocaleDateString()}` : "Basic features for enthusiasts"}
                                            </CardDescription>
                                        </div>
                                        {currentPlan?.ppp_multiplier && currentPlan.ppp_multiplier < 1 && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Regional Pricing</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {subscription && currentPlan?.ppp_multiplier && (
                                        <div className="bg-slate-50 p-3 rounded-md text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Base Price:</span>
                                                <span>USD {currentPlan.base_amount}</span>
                                            </div>
                                            <div className="flex justify-between border-b pb-1">
                                                <span className="text-muted-foreground">Regional Adjustment:</span>
                                                <span className="text-green-600">x{currentPlan.ppp_multiplier}</span>
                                            </div>
                                            <div className="flex justify-between pt-1 font-medium">
                                                <span>Current Billable Price:</span>
                                                <span>{currentPlan.currency} {currentPlan.final_amount}</span>
                                            </div>
                                        </div>
                                    )}
                                    {usage ? (
                                        <>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Active Listings</span>
                                                    <span>{usage.listings} / {limits.listings_limit === 999999 ? '∞' : limits.listings_limit}</span>
                                                </div>
                                                <Progress value={(usage.listings / (limits.listings_limit === 999999 ? usage.listings || 1 : limits.listings_limit)) * 100} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>AI Image Scans</span>
                                                    <span>{usage.aiScans} / {limits.ai_scans_limit === 999999 ? '∞' : limits.ai_scans_limit}</span>
                                                </div>
                                                <Progress value={(usage.aiScans / (limits.ai_scans_limit === 999999 ? usage.aiScans || 1 : limits.ai_scans_limit)) * 100} className="h-2" />
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-red-500 font-medium">Failed to load actual usage data.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Billing Method</CardTitle>
                                    <CardDescription>
                                        {subscription ? "Managed via Stripe" : "No active payment method"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {subscription
                                            ? "Your subscription is active and managed securely through Stripe."
                                            : "You are currently on the free plan. Add a payment method to unlock professional features."}
                                    </p>
                                    {country && (
                                        <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-wider">
                                            Billing Region: {country.name} ({country.code})
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    {!subscription && <Button variant="link" className="px-0">Add Payment Method</Button>}
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Plans */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-bold">Available Plans</h2>
                                    <p className="text-sm text-muted-foreground">Upgrade your account to access premium features.</p>
                                </div>
                                {country?.multiplier < 1 && (
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-green-600">Special Regional Pricing Applied</p>
                                        <p className="text-[10px] text-muted-foreground">Localized for {country.name}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <Card key={plan.id} className={`${plan.name === 'Professional' ? "border-primary shadow-lg relative" : ""} flex flex-col`}>
                                        {plan.name === 'Professional' && (
                                            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                                POPULAR
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle>{plan.name}</CardTitle>
                                            <div className="mt-2 space-y-1">
                                                <div className="text-3xl font-bold flex items-baseline">
                                                    <span className="text-lg mr-1 font-medium">{plan.currency || '$'}</span>
                                                    {plan.amount}
                                                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                                </div>
                                                {plan.is_localized && (
                                                    <div className="text-[10px] text-muted-foreground">
                                                        Regularly <span className="line-through">${plan.base_amount}</span> (Adjusted for your region)
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-2">
                                                {plan.features.map((feature: string) => (
                                                    <li key={feature} className="flex items-center text-sm">
                                                        <Check className="mr-2 h-4 w-4 text-green-500" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="mt-auto pt-6">
                                            <Button
                                                className="w-full"
                                                variant={plan.name === 'Professional' ? "default" : "outline"}
                                                onClick={() => handleUpgrade(plan.id)}
                                                disabled={plan.name === (currentPlan?.name || 'Starter') || upgradingId === plan.id}
                                            >
                                                {upgradingId === plan.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : null}
                                                {plan.name === (currentPlan?.name || 'Starter') ? 'Current Plan' : 'Select Plan'}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
