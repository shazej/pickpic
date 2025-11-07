"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, User, Camera, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { products as allProducts } from '@/lib/data';
import { Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductCard } from '@/components/product-card';

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
            className="w-full pr-10"
          />
          <Link href="/" passHref>
             <Button type="submit" size="icon" variant="ghost" className="absolute inset-y-0 right-0 h-full">
                <Camera className="h-5 w-5 text-muted-foreground" />
             </Button>
          </Link>
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
    </div>
  );
}
