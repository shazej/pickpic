"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, file as FileIcon, Loader2 } from "lucide-react";

interface VideoInputProps {
    onVideoReady: (file: File) => void;
    isProcessing?: boolean;
}

export function VideoInput({ onVideoReady, isProcessing }: VideoInputProps) {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        if (file) {
            onVideoReady(file);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4 w-full max-w-sm mx-auto">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <label htmlFor="video" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Upload Video or Record
                </label>
                <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                />
            </div>

            {file && (
                <div className="text-sm text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={!file || isProcessing}
                className="w-full"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Video...
                    </>
                ) : (
                    <>
                        <Video className="mr-2 h-4 w-4" />
                        Analyze & Search
                    </>
                )}
            </Button>
        </div>
    );
}
