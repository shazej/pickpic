
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  Upload,
  Loader2,
  Home,
  Users,
  BarChart,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { extractProductDetails } from '@/ai/flows/extract-product-details';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function AddProductPage() {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const dataUri = await fileToDataUri(file);
      setImagePreview(dataUri);

      const details = await extractProductDetails({ photoDataUri: dataUri });
      setProductName(details.productName);
      setDescription(details.description);

      toast({
        title: 'Product Details Extracted',
        description: "We've pre-filled the form based on your image.",
      });
    } catch (error) {
      console.error('Failed to extract product details:', error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description:
          'Could not extract details from the image. Please fill them out manually.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Product Created',
      description: `${productName} has been added to your inventory.`,
    });
    // Here you would typically save the product to your database
    console.log({ productName, description, price, imagePreview });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2 justify-center">
                <Package className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold font-headline">
                  Seller Dashboard
                </span>
              </div>
            </SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/seller/dashboard">
                  <SidebarMenuButton>
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/seller/dashboard/products">
                  <SidebarMenuButton isActive>
                    <Package className="h-5 w-5" />
                    <span>Products</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="#">
                  <SidebarMenuButton>
                    <Users className="h-5 w-5" />
                    <span>Customers</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="#">
                  <SidebarMenuButton>
                    <BarChart className="h-5 w-5" />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton>
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
              <SidebarTrigger className="sm:hidden" />
               <div className="flex items-center gap-4 flex-1">
                  <Button size="icon" variant="outline" className="hidden sm:inline-flex" asChild>
                      <Link href="/seller/dashboard/products">
                          <ArrowLeft className="h-5 w-5" />
                          <span className="sr-only">Back</span>
                      </Link>
                  </Button>
                  <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                  Add New Product
                  </h1>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Link href="/seller/dashboard/products">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  Save Product
                </Button>
              </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form
                onSubmit={handleSubmit}
                className="mx-auto grid max-w-full flex-1 auto-rows-max gap-4 lg:grid-cols-3"
              >
                <div className="grid gap-4 lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Details</CardTitle>
                      <CardDescription>
                        Upload an image to automatically fill in the product name
                        and description.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="product-name">Name</Label>
                        <Input
                          id="product-name"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g. Wireless Headphones"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="A short, catchy description of the product."
                          rows={5}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="99.99"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-4 lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Card
                          className="overflow-hidden aspect-square w-full relative group cursor-pointer"
                          onClick={triggerFileUpload}
                        >
                          <div className="h-full w-full flex items-center justify-center bg-muted/50">
                            {isLoading ? (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span>Analyzing...</span>
                              </div>
                            ) : imagePreview ? (
                              <Image
                                src={imagePreview}
                                alt="Product image"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-muted-foreground text-center p-4">
                                <Upload className="h-8 w-8" />
                                <span>Upload an Image</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white font-semibold">
                                {imagePreview ? 'Change Image' : 'Upload Image'}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </form>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
