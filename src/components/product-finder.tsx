"use client";

import { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Search, Upload } from "lucide-react";
import { identifyProduct, type IdentifyProductOutput } from "@/ai/flows/product-identification";
import { fileToDataUri } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";

export default function ProductFinder() {
  const [imagePreview, setImagePreview] = useState<string | null>(PlaceHolderImages[0]?.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);

      try {
        const dataUri = await fileToDataUri(file);
        setImagePreview(dataUri);

        const result = await identifyProduct({ photoDataUri: dataUri });
        
        if (result.productName) {
           const params = new URLSearchParams({
            productName: result.productName,
            confidence: (result.confidence * 100).toFixed(0),
            imageUrl: encodeURIComponent(dataUri),
          });
          router.push(`/sellers?${params.toString()}`);
        } else {
          toast({
            variant: "destructive",
            title: "Identification Failed",
            description: "We couldn't identify the product from the image.",
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "An Error Occurred",
          description: "Failed to process the image. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  return (
    <div className="p-4 md:p-6 space-y-4 h-full flex flex-col">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-headline text-center">Find a Product</h1>
        <p className="text-muted-foreground text-center">Upload a photo or use your camera to find it in a nearby store.</p>
      </div>

      <Card>
        <CardContent className="p-2">
          <div className="aspect-video rounded-md overflow-hidden relative bg-muted/50 flex items-center justify-center">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Product preview"
                fill
                className="object-contain"
                data-ai-hint={PlaceHolderImages[0]?.imageHint || 'product'}
              />
            ) : (
                <div className="text-muted-foreground flex flex-col items-center text-center p-4">
                    <Search className="h-10 w-10 mb-2" />
                    <p className="font-medium">Your product image will appear here</p>
                </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Identifying product...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        <Button onClick={triggerFileUpload} disabled={isLoading} size="lg">
          <Upload className="mr-2" /> Upload
        </Button>
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleImageChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        <Button onClick={triggerCamera} disabled={isLoading} variant="secondary" size="lg">
          <Camera className="mr-2" /> Camera
        </Button>
      </div>
    </div>
  );
}
