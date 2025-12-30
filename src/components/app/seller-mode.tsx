"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Camera, Loader2, CheckCircle2 } from "lucide-react"

export function SellerMode() {
    const [step, setStep] = useState<"upload" | "details" | "success">("upload")
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [price, setPrice] = useState("")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            setImagePreview(URL.createObjectURL(file))
            setStep("details")
        }
    }

    const handleSubmit = async () => {
        if (!image || !price || !description) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("image", image)
            formData.append("price", price)
            formData.append("description", description)
            formData.append("category", "General") // TODO: Add selector if needed

            const res = await fetch("/api/seller/listings/quick-create", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()

            if (res.ok) {
                setStep("success")
            } else {
                alert("Failed to create listing: " + (data.error || "Unknown error"))
            }
        } catch (e) {
            console.error(e)
            alert("Error creating listing")
        } finally {
            setIsSubmitting(false)
        }
    }

    const reset = () => {
        setImage(null)
        setImagePreview(null)
        setPrice("")
        setDescription("")
        setStep("upload")
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">

            {step === "upload" && (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 text-center border-dashed border-2">
                    <h2 className="text-2xl font-bold mb-2">Sell in seconds</h2>
                    <p className="text-muted-foreground mb-6">Snap a photo, set a price, and you're done.</p>

                    <div className="flex flex-col gap-4 items-center">
                        <div className="relative overflow-hidden rounded-lg">
                            <Button size="lg" className="w-full sm:w-auto gap-2 relative z-10">
                                <Camera className="h-5 w-5" />
                                Take Photo
                            </Button>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageSelect}
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                            />
                        </div>
                        <div className="relative overflow-hidden rounded-lg">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                                <Upload className="h-5 w-5" />
                                Upload from Gallery
                            </Button>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                            />
                        </div>
                    </div>
                </div>
            )}

            {step === "details" && imagePreview && (
                <div className="space-y-6 max-w-md mx-auto">
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 border">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Price ($)</label>
                            <Input
                                type="number"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="text-lg"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Description</label>
                            <Textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="What are you selling? Condition, age, details..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="ghost" onClick={reset} disabled={isSubmitting}>Cancel</Button>
                        <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting || !price || !description}>
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Publish Listing
                        </Button>
                    </div>
                </div>
            )}

            {step === "success" && (
                <div className="text-center py-10 space-y-4 animate-in zoom-in duration-300">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold">Listing Published!</h2>
                    <p className="text-muted-foreground">Your item is now live and searchable.</p>

                    <div className="pt-6">
                        <Button onClick={reset} size="lg">Sell Another Item</Button>
                    </div>
                </div>
            )}

            {/* Existing listings list could go here */}
            {step === "upload" && (
                <div className="opacity-50 pointer-events-none filter blur-sm select-none">
                    <h3 className="text-lg font-semibold mb-4">Your Active Listings</h3>
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800"></div>
                        ))}
                    </div>
                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        (Sign in to manage listings)
                    </div>
                </div>
            )}
        </div>
    )
}
