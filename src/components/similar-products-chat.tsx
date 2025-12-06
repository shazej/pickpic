'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import {
  Paperclip,
  Loader2,
  Bot,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { findSimilarProducts, FindSimilarProductsOutput } from '@/ai/flows/find-similar-products';
import { Card, CardContent } from './ui/card';
import Link from 'next/link';

export default function SimilarProductsChat() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FindSimilarProductsOutput | null>(null);
  const [queryImage, setQueryImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        setResult(null);
        const dataUri = await fileToDataUri(file);
        setQueryImage(dataUri);
        setImagePreview(dataUri);

        const response = await findSimilarProducts({ photoDataUri: dataUri });
        setResult(response);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not find similar products. Please try another image.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/10 rounded-full p-6 mb-6 border-8 border-primary/5">
        <ImageIcon className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-3xl font-bold font-headline mb-2">Find Similar Products</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Upload an image of a product, and our AI will find visually similar items from our catalog.
      </p>
      <Button size="lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
        <Paperclip className="mr-2 h-4 w-4" />
        Upload Image
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full">
      {!imagePreview && !isLoading && <InitialState />}
      
      {(imagePreview || isLoading) && (
        <div className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* User's uploaded image (the "question") */}
            {queryImage && (
                 <div className="flex items-start gap-4 justify-end">
                    <div className="p-2 bg-primary text-primary-foreground rounded-xl rounded-tr-none max-w-lg">
                        <Image src={queryImage} alt="Your upload" width={200} height={200} className="rounded-md" />
                    </div>
                </div>
            )}
            
            {/* AI's response area */}
            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <Bot size={22} />
                </div>
                <div className="p-4 bg-muted rounded-xl rounded-tl-none">
                  <Loader2 className="animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Finding similar products...</p>
                </div>
              </div>
            )}

            {result && (
              <div className="flex items-start gap-4">
                 <div className="bg-primary text-primary-foreground rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 self-start mt-2">
                    <Bot size={22} />
                 </div>
                 <div className="p-4 bg-muted rounded-xl rounded-tl-none max-w-2xl">
                    <p className="font-semibold mb-4">Here are some products similar to the image you uploaded:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.products.length > 0 ? result.products.map((product, index) => (
                        <Link href={`/product/${encodeURIComponent(product.name)}`} key={index} className="group">
                           <Card className="overflow-hidden h-full">
                            <CardContent className="p-0">
                                <div className="aspect-square relative w-full bg-background">
                                    <Image 
                                        src={product.photoUrl || 'https://picsum.photos/seed/placeholder/300/300'}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm truncate group-hover:text-primary">{product.name}</h3>
                                    <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                                </div>
                            </CardContent>
                           </Card>
                        </Link>
                      )) : (
                        <p className="text-muted-foreground col-span-full">No similar products were found in our catalog.</p>
                      )}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto px-4 pb-4 border-t pt-4 bg-background">
        <Button className="w-full h-12 text-base rounded-full" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
          <Paperclip className="mr-2 h-4 w-4" />
          {isLoading ? 'Analyzing...' : (imagePreview ? 'Upload Another Image' : 'Upload Image')}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
