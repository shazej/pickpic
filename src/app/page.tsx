"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, User, Camera, Search, Package2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { products as allProducts } from '@/lib/data';
import { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductCard } from '@/components/product-card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import ProductFinder from '@/components/product-finder';


export default function Home() {
    const latestProducts = allProducts.slice(0, 4);
    const bannerImage = PlaceHolderImages.find(img => img.id === 'banner-1');

  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-sm">New York, USA</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">See & Seek</span>
        </div>
        <div className="flex items-center gap-4">
            <Link href="/sellers?productName=Wireless%20Headphones">
                <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                </Button>
            </Link>
            <Link href="/login">
                <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Login</span>
                </Button>
            </Link>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search for products..."
            className="w-full"
          />
        </div>
        
        {bannerImage && (
            <div className="aspect-video md:aspect-[3/1] rounded-lg overflow-hidden relative w-full">
                <Image
                    src={bannerImage.imageUrl}
                    alt={bannerImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={bannerImage.imageHint}
                />
            </div>
        )}

        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Latest Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {latestProducts.map((product) => (
                    <ProductCard key={product.name} product={product} />
                ))}
            </div>
        </div>
      </main>

      <Sheet>
        <SheetTrigger asChild>
            <Button size="icon" className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-40">
                <Camera className="h-8 w-8" />
                <span className="sr-only">Find by image</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90%] flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-center text-2xl font-headline">Find a Product</SheetTitle>
          </SheetHeader>
          <div className="flex-grow min-h-0">
             <ProductFinder />
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
