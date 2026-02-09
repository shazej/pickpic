"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Upload, CheckCircle, Play } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
    role: 'assistant' | 'user';
    content: string;
    suggestions?: string[];
}

export function AssistantWizard() {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [draftState, setDraftState] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [currentQuestionKey, setCurrentQuestionKey] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const objectUrl = URL.createObjectURL(file);
            setFilePreview(objectUrl);

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setImageUrl(data.url);
            } else {
                alert(data.error || "Upload failed");
                setFilePreview(null);
            }
        } catch (e) {
            console.error(e);
            alert("Upload failed");
            setFilePreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const startSession = async () => {
        if (!imageUrl) return;
        setIsLoading(true);

        // Ensure URL is absolute for the server-side AI processing
        const absoluteImageUrl = imageUrl.startsWith('/')
            ? `${window.location.origin}${imageUrl}`
            : imageUrl;

        try {
            const res = await fetch("/api/ai/seller-chat/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: absoluteImageUrl }),
            });
            const data = await res.json();
            if (res.ok) {
                setSession(data);
                setDraftState(data.current_state);
                setMessages([
                    { role: 'assistant', content: data.question.question_text, suggestions: data.question.suggestions }
                ]);
                setCurrentQuestionKey(data.question.question_key);
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to start session");
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || !session) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setInputValue("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/seller-chat/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: session.session_id,
                    answer_text: text,
                    question_key: currentQuestionKey
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setDraftState(data.updated_state);
                setIsComplete(data.is_complete);

                if (data.next_question) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: data.next_question.question_text,
                        suggestions: data.next_question.suggestions
                    }]);
                    setCurrentQuestionKey(data.next_question.question_key);
                } else if (data.is_complete) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: "Great! The listing looks ready. Please review the details on the right and click Publish."
                    }]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const publishListing = async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/ai/seller-chat/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: session.session_id }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/products/${data.product_id}`);
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return (
            <Card className="w-full max-w-md mx-auto mt-10">
                <CardHeader>
                    <CardTitle className="text-center">kechiki AI Listing Assistant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            id="ai-assistant-upload"
                        />
                        {filePreview ? (
                            <div className="relative w-full aspect-square">
                                <img src={filePreview} alt="Preview" className="w-full h-full object-contain rounded-md" />
                                {isUploading && (
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="bg-primary/10 p-4 rounded-full inline-block mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg">Upload Product Photo</h3>
                                <p className="text-sm text-muted-foreground mt-2">The AI will analyze your photo to help you build a professional listing.</p>
                                <Button variant="secondary" className="mt-4" id="select-image-btn">Select Image</Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Or paste image URL/path</label>
                        <Input
                            placeholder="C:\path\to\image.png or http://..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            id="manual-url-input"
                        />
                    </div>

                    {imageUrl && !isUploading && (
                        <Button onClick={startSession} disabled={isLoading} className="w-full h-12" id="start-assistant-btn">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Start AI Assistant
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[80vh]">
            {/* Chat Interface */}
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle className="text-lg">Listing Assistant</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        }`}>
                                        <p className="text-sm">{m.content}</p>
                                        {m.suggestions && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {m.suggestions.map((s) => (
                                                    <Badge
                                                        key={s}
                                                        variant="secondary"
                                                        className="cursor-pointer hover:bg-secondary/80"
                                                        onClick={() => sendMessage(s)}
                                                    >
                                                        {s}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <div className="p-4 border-t">
                    <div className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                            placeholder="Type your answer..."
                            disabled={isLoading}
                        />
                        <Button onClick={() => sendMessage(inputValue)} disabled={isLoading || !inputValue.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Draft Preview */}
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Draft Preview</CardTitle>
                    {isComplete && <Badge className="bg-green-500">Ready</Badge>}
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="aspect-square relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {draftState.images?.[0] ? (
                            <img src={draftState.images[0]} alt="Product" className="object-cover w-full h-full" />
                        ) : (
                            <Upload className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-lg">{draftState.title || "Untitled Product"}</h3>
                            <p className="text-sm text-muted-foreground">{draftState.category || "Uncategorized"}</p>
                        </div>

                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold">
                                {draftState.price ? `${draftState.currency || '$'}${draftState.price}` : "Price TBD"}
                            </span>
                            <Badge variant="outline">{draftState.condition || "Condition TBD"}</Badge>
                        </div>

                        <div className="rounded-md bg-muted p-4 text-sm">
                            <p className="font-medium mb-2">Attributes:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(draftState.attributes || {}).map(([key, val]) => (
                                    <div key={key}>
                                        <span className="text-muted-foreground capitalize">{key}: </span>
                                        <span>{String(val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isComplete && (
                        <Button className="w-full" size="lg" onClick={publishListing} disabled={isLoading}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Publish Listing
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
