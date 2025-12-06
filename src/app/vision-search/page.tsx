
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { findSimilarProducts } from '@/ai/flows/find-similar-products';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Card, CardContent } from '@/components/ui/card';

export default function VisionSearchPage() {
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setPreviewImage(URL.createObjectURL(file));
      setSuggestedProducts([]);

      try {
        const dataUri = await fileToDataUri(file);
        const { products } = await findSimilarProducts({ photoDataUri: dataUri });

        if (products && products.length > 0) {
          setSuggestedProducts(products);
          toast({
            title: 'Products Found!',
            description: "Here are some similar products we found for you.",
          });
        } else {
          toast({
            title: 'No Products Found',
            description: "We couldn't find any similar products in our catalog.",
          });
          setPreviewImage(null);
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Something went wrong while searching for products.',
        });
        setPreviewImage(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed">
      <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h1 className="text-2xl font-bold font-headline">Visual Product Search</h1>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Have a picture of something you like? Upload it here, and our AI will find similar items in our catalog.
      </p>
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="mt-6"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Upload an Image
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 md:p-8">
        <div className="flex-1 w-full max-w-4xl mx-auto">
          {suggestedProducts.length === 0 && !previewImage ? (
            <InitialState />
          ) : (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {previewImage && (
                        <div className='w-full md:w-1/3'>
                            <Card>
                                <CardContent className='p-4'>
                                <p className='text-sm font-semibold mb-2'>Your Image</p>
                                <div className='aspect-square relative w-full rounded-md overflow-hidden border'>
                                    <Image src={previewImage} alt="Uploaded for search" fill className="object-cover" />
                                </div>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full mt-4"
                                    variant="outline"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Change Image
                                </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <div className='w-full md:w-2/3'>
                        {isLoading ? (
                            <div className="h-96 flex flex-col items-center justify-center bg-muted/50 rounded-lg">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                <p className="text-lg font-semibold text-muted-foreground">Finding similar products...</p>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="text-primary w-6 h-6" /> AI-Powered Results
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suggestedProducts.map((product) => (
                                    <ProductCard key={product.name} product={product} />
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}
        </div>
      </main>
      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
    </div>
  );
}
