
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, Loader2, ArrowLeft, Package2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { identifyProduct } from '@/ai/flows/product-identification';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function VisionSearchPage() {
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{productName: string, confidence: number} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setResult(null);
      const imageUrl = URL.createObjectURL(file);
      setImage({ url: imageUrl, file });

      try {
        const dataUri = await fileToDataUri(file);
        const identificationResult = await identifyProduct({ photoDataUri: dataUri });

        if (identificationResult && identificationResult.productName) {
            setResult(identificationResult);
            // Automatically redirect to sellers page
            const confidencePercent = Math.round(identificationResult.confidence * 100);
            router.push(`/sellers?productName=${encodeURIComponent(identificationResult.productName)}&confidence=${confidencePercent}`);
        } else {
          toast({
            variant: 'destructive',
            title: 'Identification Failed',
            description: 'Could not identify the product in the image.',
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred during analysis.',
        });
        setIsLoading(false);
      }
    }
  };

  const productSearchImage = PlaceHolderImages.find(img => img.id === '1');

  return (
    <div className="min-h-screen w-full bg-muted/20 flex flex-col">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/">
                <ArrowLeft />
            </Link>
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">Ecomm Now</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Find Products by Image</CardTitle>
            <CardDescription>
              Upload a photo of any product, and our AI will find sellers near you who have it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="relative aspect-video w-full border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {isLoading ? (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="font-medium">Analyzing your image...</p>
                  <p className="text-sm text-muted-foreground">Please wait a moment.</p>
                </div>
              ) : null}
              
              {image?.url ? (
                <Image
                  src={image.url}
                  alt="Uploaded preview"
                  fill
                  className="object-contain rounded-lg"
                />
              ) : (
                productSearchImage && (
                    <Image
                      src={productSearchImage.imageUrl}
                      alt={productSearchImage.description}
                      fill
                      className="object-cover rounded-lg opacity-10"
                      data-ai-hint={productSearchImage.imageHint}
                    />
                )
              )}

              {!image && !isLoading && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <p className="text-sm font-semibold text-foreground">Click or tap here to upload an image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WEBP accepted</p>
                 </div>
              )}
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isLoading ? 'Analyzing...' : image ? 'Upload Another Image' : 'Upload Image'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              disabled={isLoading}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
