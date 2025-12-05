
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { products, findSellersByProduct, sellers as allSellers } from '@/lib/data';
import { Product, Seller } from '@/lib/types';
import { notFound } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, Heart, Clock, Eye, Video, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const productName = decodeURIComponent(params.productName as string);

  const product: Product | undefined = products.find(
    (p) => p.name.toLowerCase() === productName.toLowerCase()
  );

  if (!product) {
    return notFound();
  }

  // For this example, let's just pick the first seller that has this product
  // In a real app, you might have a specific ad ID to fetch the exact seller
  const seller: Seller | undefined = allSellers.find(s => s.products.some(p => p.name === product.name));
  
  if (!seller) {
    // Or handle this case more gracefully
    return notFound();
  }

  const securityGuidelines = [
    "Make sure to meet the seller in person and confirm his identity (preferably in a public place in the presence of a friend).",
    "Ensure that the product is inspected and examined by specialists.",
    "Documenting the sale/purchase process with full details of the product.",
    "Not to transfer any money only after confirming the identity of the seller and documenting the sale process and receiving the product.",
    "Ensure that you get a signed receipt from the seller."
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 bg-muted/20">
      <Breadcrumb className="mb-4 text-sm">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home Page</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/category/${product.category.toLowerCase()}`}>{product.category}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Advertised: {Math.floor(Math.random() * 10000000)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={seller.photoUrl} alt={seller.name} />
                  <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg">{seller.name}</h3>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Member since August 2025</span>
                      <span>{Math.floor(Math.random() * 50)} Advertisement</span>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">Follow</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {securityGuidelines.map((guideline, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>{guideline}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video relative w-full group">
                <Image
                    src={product.photoUrl || "https://picsum.photos/seed/product/1200/800"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    data-ai-hint={product.photoHint}
                />
                 <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <Button variant="secondary" size="icon" className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100">
                    <ChevronLeft />
                 </Button>
                 <Button variant="secondary" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100">
                    <ChevronRight />
                 </Button>
                 <Badge className="absolute bottom-2 left-2">1/1</Badge>
                 <Button variant="secondary" className="absolute bottom-2 right-2">
                    <Video className="h-4 w-4 mr-2" />
                    Video
                 </Button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Three weeks ago</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span>{Math.floor(Math.random() * 100)} Views</span>
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <p className="text-3xl font-bold text-primary mb-6">
                  {product.price.toFixed(0)} KWD
                </p>
                <div className="space-y-4">
                    <Button size="lg" className="w-full">
                        Call
                    </Button>
                     <Button size="lg" variant="outline" className="w-full">
                        Chat
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
