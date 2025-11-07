"use client";

import { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Loader2, Search, Upload } from "lucide-react";
import { identifyProduct, type IdentifyProductOutput } from "@/ai/flows/product-identification";
import { fileToDataUri } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { findSellersByProduct } from "@/lib/data";
import type { Seller } from "@/lib/types";
import SellerList from "@/components/seller-list";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";


type ProductFinderProps = {
  onSellersFound: (sellers: Seller[]) => void;
  onSellerSelect: (seller: Seller | null) => void;
}

export default function ProductFinder({ onSellersFound, onSellerSelect }: ProductFinderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(PlaceHolderImages[0]?.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<IdentifyProductOutput | null>(null);
  const [foundSellers, setFoundSellers] = useState<Seller[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setAiResult(null);
      onSellersFound([]);
      setFoundSellers([]);

      try {
        const dataUri = await fileToDataUri(file);
        setImagePreview(dataUri);

        const result = await identifyProduct({ photoDataUri: dataUri });
        setAiResult(result);
        
        if (result.productName) {
          const sellers = findSellersByProduct(result.productName);
          setFoundSellers(sellers);
          onSellersFound(sellers);
          if (sellers.length === 0) {
             toast({
                title: "No Sellers Found",
                description: `We couldn't find any local sellers for "${result.productName}".`,
             });
          }
        } else {
          onSellersFound([]);
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
        <h1 className="text-2xl font-bold font-headline text-center md:text-left">Find a Product</h1>
        <p className="text-muted-foreground text-center md:text-left">Upload a photo or use your camera to find it in a nearby store.</p>
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

      {aiResult && (
        <div className="space-y-4 flex-grow min-h-0 flex flex-col">
          <div className="flex-shrink-0">
            <h2 className="text-xl font-semibold">Sellers for: <span className="text-primary font-bold">{aiResult.productName}</span></h2>
            <p className="text-sm text-muted-foreground">Confidence: {(aiResult.confidence * 100).toFixed(0)}%</p>
          </div>
          <div className="overflow-y-auto pr-1 flex-grow">
            <SellerList 
              sellers={foundSellers} 
              productName={aiResult.productName} 
              onSellerSelect={onSellerSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
