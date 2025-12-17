"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    isProcessing?: boolean;
}

export function AudioRecorder({ onRecordingComplete, isProcessing }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                onRecordingComplete(blob);
                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
                {!isRecording ? (
                    <Button
                        onClick={startRecording}
                        disabled={isProcessing}
                        variant="outline"
                        className="h-16 w-16 rounded-full border-2 border-primary"
                    >
                        <Mic className="h-8 w-8" />
                    </Button>
                ) : (
                    <Button
                        onClick={stopRecording}
                        variant="destructive"
                        className="h-16 w-16 rounded-full animate-pulse"
                    >
                        <Square className="h-8 w-8" />
                    </Button>
                )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
                {isRecording ? "Recording... (Tap to stop)" : "Tap microphone to speak"}
            </p>
            {isProcessing && (
                <div className="flex items-center text-sm text-primary">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing audio...
                </div>
            )}
        </div>
    );
}
