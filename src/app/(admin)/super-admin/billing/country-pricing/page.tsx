
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit2, Check, X, RefreshCcw } from "lucide-react";

interface CountryPricing {
    id: string;
    country_code: string;
    country_name: string;
    ppp_multiplier: number;
    currency_code: string;
    rounding_rule: string;
    is_active: boolean;
}

const BASE_PLANS = [
    { name: 'Professional', amount: 29 },
    { name: 'Enterprise', amount: 99 }
];

export default function CountryPricingPage() {
    const [countries, setCountries] = useState<CountryPricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<CountryPricing>>({});
    const { toast } = useToast();

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/super-admin/billing/country-pricing');
            const data = await res.json();
            if (data.countries) setCountries(data.countries);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch country pricing." });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (country: CountryPricing) => {
        setEditingId(country.id);
        setEditForm(country);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async (id: string) => {
        try {
            const res = await fetch('/api/super-admin/billing/country-pricing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editForm })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: "Pricing updated successfully." });
                setEditingId(null);
                fetchCountries();
            } else {
                toast({ variant: "destructive", title: "Update Failed", description: data.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save changes." });
        }
    };

    const calculatePreview = (amount: number, multiplier: number) => {
        return (amount * multiplier).toFixed(2);
    };

    if (loading) {
        return (
            <div className="container py-8 flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Country PPP Pricing</h1>
                    <p className="text-muted-foreground">Manage regional pricing multipliers based on Purchasing Power Parity.</p>
                </div>
                <Button variant="outline" onClick={fetchCountries}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Regional Price Multipliers</CardTitle>
                    <CardDescription>
                        Adjust the PPP multiplier to automatically localize plan prices. Existing subscriptions are not affected.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Country</TableHead>
                                <TableHead>Multiplier</TableHead>
                                <TableHead>Currency</TableHead>
                                <TableHead>Preview (Pro / Ent)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {countries.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">
                                        {c.country_name} <span className="text-xs text-muted-foreground ml-1">({c.country_code})</span>
                                    </TableCell>
                                    <TableCell>
                                        {editingId === c.id ? (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="w-24"
                                                value={editForm.ppp_multiplier}
                                                onChange={(e) => setEditForm({ ...editForm, ppp_multiplier: parseFloat(e.target.value) })}
                                            />
                                        ) : (
                                            <span className="font-mono">{c.ppp_multiplier.toFixed(2)}x</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === c.id ? (
                                            <Input
                                                className="w-20 uppercase"
                                                maxLength={3}
                                                value={editForm.currency_code}
                                                onChange={(e) => setEditForm({ ...editForm, currency_code: e.target.value })}
                                            />
                                        ) : (
                                            <Badge variant="secondary">{c.currency_code}</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Pro:</span> {c.currency_code} {calculatePreview(29, editingId === c.id ? (editForm.ppp_multiplier || 1) : c.ppp_multiplier)}
                                            <br />
                                            <span className="text-muted-foreground">Ent:</span> {c.currency_code} {calculatePreview(99, editingId === c.id ? (editForm.ppp_multiplier || 1) : c.ppp_multiplier)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {c.is_active ? (
                                            <Badge className="bg-green-100 text-green-800 border-none">Active</Badge>
                                        ) : (
                                            <Badge variant="outline">Disabled</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === c.id ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                                                <Button size="sm" onClick={() => handleSave(c.id)}><Check className="h-4 w-4" /></Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Country</CardTitle>
                        <CardDescription>Support a new region with custom PPP multipliers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">ISO-2 Code</label>
                                <Input placeholder="e.g. FR" maxLength={2} id="new-code" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input placeholder="e.g. France" id="new-name" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">PPP Multiplier</label>
                                <Input type="number" step="0.01" defaultValue="1.00" id="new-multiplier" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Currency</label>
                                <Input placeholder="EUR" maxLength={3} id="new-currency" />
                            </div>
                        </div>
                        <Button className="w-full" onClick={async () => {
                            const code = (document.getElementById('new-code') as HTMLInputElement).value;
                            const name = (document.getElementById('new-name') as HTMLInputElement).value;
                            const multiplier = parseFloat((document.getElementById('new-multiplier') as HTMLInputElement).value);
                            const currency = (document.getElementById('new-currency') as HTMLInputElement).value;

                            if (!code || !name || isNaN(multiplier)) {
                                toast({ variant: "destructive", title: "Error", description: "Please fill all fields correctly." });
                                return;
                            }

                            try {
                                const res = await fetch('/api/super-admin/billing/country-pricing', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        country_code: code,
                                        country_name: name,
                                        ppp_multiplier: multiplier,
                                        currency_code: currency,
                                        rounding_rule: 'round'
                                    })
                                });
                                const data = await res.json();
                                if (data.success) {
                                    toast({ title: "Success", description: "Country added." });
                                    fetchCountries();
                                } else {
                                    toast({ variant: "destructive", title: "Failed", description: data.error });
                                }
                            } catch (error) {
                                toast({ variant: "destructive", title: "Error", description: "System error." });
                            }
                        }}>
                            <Plus className="mr-2 h-4 w-4" /> Add Country Support
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-slate-600">Pricing Safety Note</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-500 space-y-4">
                        <p>Changes to PPP multipliers only affect <strong>new subscriptions</strong>. Existing active subscriptions are locked at the price they were created with for the duration of the subscription life.</p>
                        <p>If you disable a country's pricing, future users from that region will default to <strong>Standard US Pricing (1.00 multiplier)</strong> in USD.</p>
                        <p>Ensure currency codes match what is supported in your Stripe account.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
