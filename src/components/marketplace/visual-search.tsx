
"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VisualSearchProps {
    onSearch: (file: File) => void;
    isProcessing: boolean;
}

import { useLanguage } from "@/components/i18n/LanguageContext";

export function VisualSearch({ onSearch, isProcessing }: VisualSearchProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { t } = useLanguage();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            onSearch(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            onSearch(file);
        }
    };

    return (
        <Card
            className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer bg-muted/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center gap-4 py-8">
                {isProcessing ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                            <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                        </div>
                        <p className="mt-4 text-lg font-medium text-muted-foreground">{t('buyer.analyzing_image')}</p>
                    </div>
                ) : preview ? (
                    <div className="relative w-full aspect-video md:aspect-square max-h-96 rounded-lg overflow-hidden ring-4 ring-background shadow-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white font-medium">{t('buyer.click_to_change')}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-6 bg-background rounded-full shadow-sm ring-1 ring-border">
                            <Camera className="w-12 h-12 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight">{t('buyer.snap_or_upload')}</h3>
                            <p className="text-muted-foreground">
                                {t('buyer.drag_msg')}
                            </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button variant="secondary" className="pointer-events-none">
                                <Upload className="w-4 h-4 mr-2" />
                                {t('buyer.upload_file')}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
}
