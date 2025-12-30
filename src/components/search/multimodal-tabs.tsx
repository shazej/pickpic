"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic, Video as VideoIcon, Type } from "lucide-react";
import { AudioRecorder } from "./audio-recorder";
import { VideoInput } from "./video-input";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BuyerAssistant } from "@/components/product/buyer-assistant";
import { Sparkles, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export function MultimodalTabs() {
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [textQuery, setTextQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Restore state on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('pickpic_search_state');
        if (saved) {
            const { results, meta, textQuery, activeTab } = JSON.parse(saved);
            setResults(results || []);
            setSearchMeta(meta || null);
            setTextQuery(textQuery || "");
            setActiveTab(activeTab || "text");
        }
    }, []);

    // Persist state on change
    useEffect(() => {
        sessionStorage.setItem('pickpic_search_state', JSON.stringify({
            results,
            meta: searchMeta,
            textQuery,
            activeTab
        }));
    }, [results, searchMeta, textQuery, activeTab]);

    const handleTextSearch = async () => {
        if (!textQuery.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(textQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                setSearchMeta({ type: 'text', query: textQuery });
            } else {
                setError("Failed to fetch products. Please try again.");
            }
        } catch (e) {
            setError("Network error. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAudioSearch = async (blob: Blob) => {
        setIsLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append("audio", blob);

        try {
            const res = await fetch("/api/search/audio", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setResults(data.results);
                setSearchMeta({ type: 'audio', transcript: data.transcript, intent: data.intent });
            } else {
                setError(data.error || "Audio search failed");
            }
        } catch (e) {
            setError("Audio processing error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVideoSearch = async (file: File) => {
        setIsLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append("video", file);

        try {
            const res = await fetch("/api/search/video", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setResults(data.results);
                setSearchMeta({ type: 'video', descriptor: data.visual_descriptor });
            } else {
                setError(data.error || "Video search failed");
            }
        } catch (e) {
            setError("Video processing error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <Tabs defaultValue="text" className="w-full" onValueChange={setActiveTab}>
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="text"><Type className="mr-2 h-4 w-4" /> Text</TabsTrigger>
                        <TabsTrigger value="voice"><Mic className="mr-2 h-4 w-4" /> Voice</TabsTrigger>
                        <TabsTrigger value="video"><VideoIcon className="mr-2 h-4 w-4" /> Video</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="text" className="max-w-xl mx-auto">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search for products..."
                            value={textQuery}
                            onChange={(e) => setTextQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
                        />
                        <Button onClick={handleTextSearch}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="voice" className="max-w-xl mx-auto">
                    <div className="border rounded-lg p-8 bg-muted/20">
                        <h3 className="text-center font-medium mb-4">Tap to Speak</h3>
                        <AudioRecorder onRecordingComplete={handleAudioSearch} isProcessing={isLoading} />
                        {searchMeta?.type === 'audio' && (
                            <div className="mt-4 p-4 bg-muted rounded text-center">
                                <p className="text-sm font-semibold">Understood:</p>
                                <p className="italic">"{searchMeta.transcript}"</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="video" className="max-w-xl mx-auto">
                    <div className="border rounded-lg p-8 bg-muted/20">
                        <h3 className="text-center font-medium mb-4">Find Similar</h3>
                        <VideoInput onVideoReady={handleVideoSearch} isProcessing={isLoading} />
                        {searchMeta?.type === 'video' && (
                            <div className="mt-4 p-4 bg-muted rounded text-center">
                                <p className="text-sm font-semibold">Visual Keywords:</p>
                                <div className="flex flex-wrap gap-2 justify-center mt-2">
                                    {searchMeta.descriptor.keywords.map((k: string) => (
                                        <Badge key={k} variant="outline">{k}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                    <XCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">{error}</p>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">Dismiss</Button>
                </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="h-full overflow-hidden">
                            <Skeleton className="aspect-square w-full" />
                            <CardHeader className="p-4 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                            </CardHeader>
                            <CardFooter className="p-4 pt-0">
                                <Skeleton className="h-3 w-1/2" />
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    results.map((product) => (
                        <div key={product.id} className="group relative">
                            <Link href={`/p/${product.id}`}>
                                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className="aspect-square relative bg-muted overflow-hidden">
                                        {product.image && (
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        )}
                                        {!product.image && (
                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-slate-100 dark:bg-slate-900">
                                                <Sparkles className="h-8 w-8 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="secondary" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                                                {product.condition}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">{product.title}</CardTitle>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-lg font-bold text-primary">
                                                {product.currency || '$'}{product.price}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground border-t bg-slate-50/50 dark:bg-slate-900/50">
                                        Listed in {product.category}
                                    </CardFooter>
                                </Card>
                            </Link>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                <BuyerAssistant productId={product.id} />
                            </div>
                        </div>
                    ))
                )}
                {results.length === 0 && !isLoading && searchMeta && (
                    <div className="col-span-full text-center py-20 border-2 border-dashed rounded-2xl bg-muted/5">
                        <div className="max-w-xs mx-auto space-y-4">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No products found</h3>
                            <p className="text-sm text-muted-foreground">
                                We couldn't find anything matching your {searchMeta.type} search. Try adjusting your keywords or using a different search method.
                            </p>
                            <Button variant="outline" onClick={() => { setResults([]); setSearchMeta(null); setTextQuery(""); }}>
                                Clear Search
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
