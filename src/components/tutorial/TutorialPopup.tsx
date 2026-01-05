"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Camera,
    Search,
    MessageCircle,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Store,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Step {
    title: string;
    description: string;
    icon: any;
    color: string;
}

const steps: Step[] = [
    {
        title: "Welcome to sale chat",
        description: "Your AI-powered free marketplace. No fees, just easy buying and selling with the power of AI.",
        icon: Sparkles,
        color: "bg-blue-500"
    },
    {
        title: "AI-Driven Search",
        description: "Upload any image to find exactly what you're looking for. Our AI analyzes products and helps you find the best deals.",
        icon: Search,
        color: "bg-purple-500"
    },
    {
        title: "Smart Seller Helper",
        description: "Selling something? Just upload a photo. Our AI studies the image to help you create a perfect listing in minutes.",
        icon: Camera,
        color: "bg-green-500"
    },
    {
        title: "Direct Messaging",
        description: "Chat directly with buyers and sellers. Get real-time answers and negotiate fairly without middleman fees.",
        icon: MessageCircle,
        color: "bg-orange-500"
    },
    {
        title: "Location Aware",
        description: "See exactly where products are located. Find local deals and meet sellers easily with integrated geolocation.",
        icon: Store,
        color: "bg-red-500"
    }
];

interface TutorialPopupProps {
    onClose: () => void;
    forceShow?: boolean;
}

export function TutorialPopup({ onClose, forceShow = false }: TutorialPopupProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem("tutorial_shown");
        if (!hasSeenTutorial || forceShow) {
            setIsVisible(true);
        }
    }, [forceShow]);

    const handleClose = () => {
        localStorage.setItem("tutorial_shown", "true");
        setIsVisible(false);
        onClose();
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!isVisible) return null;

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-background border rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header/Close */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>

                    {/* Content Section */}
                    <div className="p-8 pb-4 flex flex-col items-center text-center">
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={cn("p-4 rounded-2xl mb-6 text-white", step.color)}
                        >
                            <Icon className="h-10 w-10" />
                        </motion.div>

                        <motion.h2
                            key={`title-${currentStep}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-2xl font-bold mb-3"
                        >
                            {step.title}
                        </motion.h2>

                        <motion.p
                            key={`desc-${currentStep}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-muted-foreground leading-relaxed h-20"
                        >
                            {step.description}
                        </motion.p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 mb-8">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 transition-all duration-300 rounded-full",
                                    idx === currentStep ? "w-8 bg-primary" : "w-1.5 bg-muted"
                                )}
                            />
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-muted/50 border-t flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </Button>

                        <div className="flex items-center gap-2">
                            {currentStep < steps.length - 1 ? (
                                <Button onClick={nextStep} className="gap-2 px-6">
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleClose} className="gap-2 px-6 bg-green-600 hover:bg-green-700">
                                    Got it!
                                    <CheckCircle2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
