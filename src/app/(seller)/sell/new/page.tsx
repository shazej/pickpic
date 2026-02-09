"use client";

import { VisualSearchUploader } from "@/components/search/visual-search-uploader";

// Force dynamic rendering for this authenticated route
export const dynamic = 'force-dynamic';
import { ListingForm } from "@/components/seller/listing-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function NewListingPage() {
    const [step, setStep] = useState<"upload" | "form">("upload");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<any>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleImageSelect = async (file: File) => {
        setImageFile(file);
        setIsAnalyzing(true);
        setStep("form");

        // Simulate multi-step analysis
        const analysisSteps = [
            "Detecting item type...",
            "Estimating market price...",
            "Generating description...",
            "Finalizing details..."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < analysisSteps.length) {
                // We could use a state for sub-status if needed
                i++;
            } else {
                clearInterval(interval);
                setAnalyzedData({
                    title: "Vintage Canon AE-1 Film Camera",
                    price: "185.00",
                    category: "electronics",
                    condition: "good",
                    description: "A classic 35mm SLR film camera. Appears to be in good working condition with some minor surface wear. Includes original lens cap."
                });
                setIsAnalyzing(false);
                toast({
                    title: "AI Analysis Complete! ✨",
                    description: "We've pre-filled the form based on your photo. Take a look and publish when ready.",
                });
            }
        }, 1200);
    };

    const handleFormSubmit = async (values: any) => {
        // Submit listing logic
        console.log("Submitting:", values, imageFile);
        toast({ title: "Success", description: "Listing created successfully!" });
        router.push('/sell');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Create New Listing</h1>
                <p className="text-muted-foreground">Upload a photo to get started with our AI assistant.</p>
            </div>

            {step === "upload" && (
                <VisualSearchUploader
                    onImageSelect={handleImageSelect}
                    onClear={() => { }}
                />
            )}

            {step === "form" && (
                <div className="space-y-6 relative">
                    {isAnalyzing && (
                        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 border rounded-xl shadow-2xl">
                            <div className="relative mb-8">
                                <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Analyzing your item...</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <p className="text-muted-foreground animate-pulse">Gemini is processing the visual data</p>
                            </div>
                            <div className="w-full max-w-xs bg-muted rounded-full h-1 overflow-hidden">
                                <div className="bg-primary h-full animate-pulse" style={{ width: '40%' }} />
                            </div>
                        </div>
                    )}

                    {imageFile && !isAnalyzing && (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                            <div className="h-16 w-16 relative rounded overflow-hidden">
                                {/* Use URL.createObjectURL temporarily for display, proper way in real app */}
                            </div>
                            <div>
                                <p className="font-medium text-sm">Image uploaded</p>
                                <Button variant="link" className="px-0 h-auto text-xs" onClick={() => setStep("upload")}>Change photo</Button>
                            </div>
                        </div>
                    )}

                    <Card className="p-6">
                        <ListingForm
                            initialValues={analyzedData}
                            onSubmit={handleFormSubmit}
                        />
                    </Card>
                </div>
            )}
        </div>
    );
}
