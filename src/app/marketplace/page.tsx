"use client";

import { useState } from "react";
import { VisualSearch } from "@/components/marketplace/visual-search";
import { RefinementChat } from "@/components/marketplace/refinement-chat";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Import a valid icon
// If Plus is not available, we can use another one, but lucide-react should have it.

export default function MarketplacePage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lastUpload, setLastUpload] = useState<File | null>(null);

    const handleSearch = async (file: File) => {
        setIsLoading(true);
        setLastUpload(file);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("intent", "search");

        try {
            const res = await fetch("/api/marketplace/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async (text: string) => {
        if (!lastUpload) return;
        setIsLoading(true);

        const formData = new FormData();
        formData.append("image", lastUpload); // Re-send context
        formData.append("intent", "search");
        formData.append("refinement", text);

        try {
            const res = await fetch("/api/marketplace/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (e) {
            console.error("Refinement failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleListIt = async () => {
        if (!lastUpload) return;
        setIsLoading(true);

        const formData = new FormData();
        formData.append("image", lastUpload);
        formData.append("intent", "list");

        try {
            const res = await fetch("/api/marketplace/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                alert("Listing Created! ID: " + data.listingId);
                // Refresh search to show it?
                handleSearch(lastUpload);
            }
        } catch (e) {
            console.error("Listing failed", e);
            alert("Failed to list item");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 min-h-screen flex flex-col gap-12 relative">
            <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    See it. Buy it.
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    The image-first marketplace. No categories, no filters. Just snap what you want.
                </p>
            </header>

            <section>
                <VisualSearch onSearch={handleSearch} isProcessing={isLoading} />
            </section>

            {lastUpload && (
                <RefinementChat onRefine={handleRefine} isLoading={isLoading} />
            )}

            {results.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Found matches</h2>
                        <Button onClick={handleListIt} variant="outline" size="lg">
                            <Plus className="w-4 h-4 mr-2" />
                            Sell This Item
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {results.map((item: any) => (
                            <div key={item.id} className="group relative aspect-square bg-muted rounded-xl overflow-hidden hover:shadow-2xl transition-all">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={item.image_url || '/placeholder.png'}
                                    alt={item.title}
                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                    <p className="text-white font-bold text-lg">{item.title}</p>
                                    <p className="text-white/80">{item.currency} {item.price}</p>
                                    {item.score && (
                                        <p className="text-xs text-green-400 mt-1">
                                            {Math.round(item.score * 100)}% Match
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State / Prompt */}
            {!isLoading && results.length === 0 && lastUpload && (
                <div className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-2">No matches found yet.</h3>
                    <p className="text-muted-foreground mb-6">Be the first to sell this!</p>
                    <Button onClick={handleListIt} size="lg">
                        List as New Item
                    </Button>
                </div>
            )}
        </div>
    );
}
