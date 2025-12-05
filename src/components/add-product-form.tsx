
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Package, FileText, DollarSign, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { extractProductDetails } from '@/ai/flows/extract-product-details';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

type ProductDetails = {
    productName?: string;
    description?: string;
    price?: number;
}

export default function AddProductForm() {
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetails>({
      productName: '',
      description: '',
      price: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        const uploadedImage = { url: imageUrl, file: file };
        setImage(uploadedImage);

        try {
          const dataUri = await fileToDataUri(file);
          const details = await extractProductDetails({ photoDataUri: dataUri });
          if (details) {
            setProductDetails(prev => ({
                ...prev,
                productName: details.productName,
                description: details.description,
            }));
            toast({
                title: 'Details Extracted',
                description: 'Product name and description have been auto-filled.',
            })
          }
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not extract details from the image.',
            });
        } finally {
            setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = () => {
    toast({
        title: "Product Created!",
        description: `${productDetails.productName} has been added to your inventory.`,
    });
    // Reset state for new product creation
    setProductDetails({ productName: '', description: '', price: 0 });
    setImage(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
            <CardDescription>Upload a clear image of your product.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="aspect-square w-full rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden">
                   {image ? (
                        <Image src={image.url} alt="Product Preview" width={400} height={400} className="object-cover h-full w-full" />
                   ) : (
                    <div className="text-center text-muted-foreground">
                        <ImagePlus className="mx-auto h-12 w-12" />
                        <p className="mt-2">Image Preview</p>
                    </div>
                   )}
                </div>
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {image ? 'Change Image' : 'Upload Image'}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
         <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Fill in the details for your new product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
                <div className="space-y-2">
                    <Label htmlFor="product-name" className='flex items-center gap-2'><Package className='w-4 h-4 text-muted-foreground' /> Name</Label>
                    <Input id="product-name" value={productDetails.productName || ''} onChange={e => setProductDetails(p => ({...p, productName: e.target.value}))} placeholder="e.g. Wireless Headphones" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description" className='flex items-center gap-2'><FileText className='w-4 h-4 text-muted-foreground' /> Description</Label>
                    <Textarea id="description" value={productDetails.description || ''} onChange={e => setProductDetails(p => ({...p, description: e.target.value}))} placeholder="A short, catchy description..." rows={6} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price" className='flex items-center gap-2'><DollarSign className='w-4 h-4 text-muted-foreground' /> Price</Label>
                    <Input id="price" type="number" value={productDetails.price || ''} onChange={e => setProductDetails(p => ({...p, price: Number(e.target.value)}))} placeholder="99.99" />
                </div>
            </CardContent>
             <div className='p-6 pt-0 mt-auto'>
                <Button className="w-full" onClick={handleCreateProduct}>
                    Create Product
                </Button>
             </div>
         </Card>
      </div>
    </div>
  );
}
