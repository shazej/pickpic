"use client"

import { ScreenShell } from "@/components/ui/screen-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, ChevronRight, MessageSquare, AlertCircle } from "lucide-react"

export default function DesignTestPage() {
    return (
        <div className="grid gap-8 p-8 bg-muted/20">

            {/* 1. Screen Shell Demo - with Sticky Action */}
            <section className="border rounded-xl overflow-hidden shadow-2xl max-w-sm mx-auto h-[600px] relative bg-background">
                <ScreenShell
                    title="Product Details"
                    actionParams={{
                        label: "Add to Cart",
                        onClick: () => alert("Added!"),
                        variant: "default"
                    }}
                >
                    <div className="space-y-6">
                        <div className="h-64 bg-secondary rounded-lg flex items-center justify-center">
                            <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Vintage Camera Lens</h1>
                            <p className="text-xl font-semibold text-primary mt-1">$250.00</p>
                        </div>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Mint condition 50mm f/1.8 lens. Perfect for portrait photography.
                            Includes original cap and box.
                        </p>

                        <div className="space-y-4 pt-4">
                            <h2 className="font-semibold text-lg">Details</h2>
                            <div className="flex justify-between py-3 border-b">
                                <span className="text-muted-foreground">Condition</span>
                                <span className="font-medium">Like New</span>
                            </div>
                            <div className="flex justify-between py-3 border-b">
                                <span className="text-muted-foreground">Brand</span>
                                <span className="font-medium">Canon</span>
                            </div>
                        </div>
                    </div>
                </ScreenShell>
            </section>

            {/* 2. Empty State Demo */}
            <section className="border rounded-xl overflow-hidden shadow-lg max-w-sm mx-auto h-[400px] bg-background">
                <EmptyState
                    icon={MessageSquare}
                    title="No Messages Yet"
                    description="When you contact a seller, your chat conversation will appear here."
                    actionLabel="Browse Products"
                    onAction={() => { }}
                />
            </section>

            {/* 3. Component Gallery */}
            <section className="max-w-xl mx-auto space-y-8 bg-card p-8 rounded-xl border">
                <h2 className="text-2xl font-bold">Component Gallery</h2>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Buttons</h3>
                    <div className="flex flex-wrap gap-4">
                        <Button size="lg">Primary Action (lg)</Button>
                        <Button variant="secondary" size="lg">Secondary</Button>
                        <Button variant="outline" size="sm">Outline (sm)</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button size="icon" variant="outline"><ChevronRight /></Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Inputs</h3>
                    <div className="space-y-4 max-w-xs">
                        <Input placeholder="Standard Input" />
                        <Input placeholder="Active Input" autoFocus />
                        <Input placeholder="Disabled Input" disabled />
                    </div>
                </div>
            </section>

        </div>
    )
}
