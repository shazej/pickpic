
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2, ExternalLink } from "lucide-react"
import Image from "next/image"

export default function MediaPage() {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchImages();
    }, []);

    async function fetchImages() {
        setLoading(true);
        try {
            const res = await fetch(`/api/super-admin/media`);
            const data = await res.json();
            if (data.success) {
                setImages(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!selectedImage) return;
        try {
            const res = await fetch('/api/super-admin/media', {
                method: 'DELETE',
                body: JSON.stringify({ imageId: selectedImage.id })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: "Image deleted" });
                setImages(images.filter(img => img.id !== selectedImage.id));
                setSelectedImage(null);
            } else {
                toast({ title: "Error", description: data.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Media Moderation</h1>
                <p className="text-muted-foreground">Review and remove user-uploaded content.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10">Loading media...</div>
                ) : images.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">No images found.</div>
                ) : (
                    images.map((img) => (
                        <Card key={img.id} className="overflow-hidden group relative">
                            <div className="aspect-square relative">
                                <Image
                                    src={img.url}
                                    alt="Product Image"
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button size="icon" variant="destructive" onClick={() => setSelectedImage(img)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="secondary" asChild>
                                        <a href={img.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                            <div className="p-2 text-xs truncate text-muted-foreground">
                                {img.product_title}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Image?</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video relative rounded-md overflow-hidden bg-black">
                        {selectedImage && (
                            <Image
                                src={selectedImage.url}
                                alt="To delete"
                                fill
                                className="object-contain"
                            />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this image? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedImage(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
