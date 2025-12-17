"use client";

import { VisualSearchUploader } from "@/components/search/visual-search-uploader";
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
        setStep("form"); // Move to form but show loader overlay or similar

        // Mock AI Analysis
        setTimeout(() => {
            setAnalyzedData({
                title: "Detected: Vintage Camera",
                price: "150",
                category: "electronics",
                condition: "good",
                description: "AI Generated: This is a vintage camera in good condition. Looks like a Canon AE-1."
            });
            setIsAnalyzing(false);
            toast({
                title: "AI Analysis Complete",
                description: "We've pre-filled the form for you!",
            });
        }, 2000);
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
                        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                            <Sparkles className="h-12 w-12 text-primary animate-pulse mb-4" />
                            <h3 className="text-xl font-bold">AI is analyzing your item...</h3>
                            <p className="text-muted-foreground">Identifying category, price, and condition</p>
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
