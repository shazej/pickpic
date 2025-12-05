"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, User, Camera, Search, Package2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { products as allProducts } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductCard } from '@/components/product-card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import LocationPrompt from '@/components/location-prompt';
import { useLocation } from '@/hooks/use-location';

export default function Home() {
    const latestProducts = allProducts.slice(0, 4);
    const bannerImages = PlaceHolderImages.filter(img => img.id.startsWith('banner-'));
    const { city, country } = useLocation();

  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground">
      <LocationPrompt />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-sm">{city && country ? `${city}, ${country}`: 'New York, USA'}</span>
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
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {bannerImages.map((bannerImage) => (
              <CarouselItem key={bannerImage.id}>
                <div className="aspect-video md:aspect-[3/1] rounded-lg overflow-hidden relative w-full">
                  <Image
                    src={bannerImage.imageUrl}
                    alt={bannerImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={bannerImage.imageHint}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
        </Carousel>

        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Latest Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {latestProducts.map((product) => (
                    <ProductCard key={product.name} product={product} />
                ))}
            </div>
        </div>
      </main>

       <Link href="/vision-search">
        <Button size="icon" className="fixed bottom-28 right-6 h-16 w-16 rounded-full shadow-lg z-40 md:bottom-6">
            <Camera className="h-8 w-8" />
            <span className="sr-only">Find by image</span>
        </Button>
      </Link>


      <footer className="border-t bg-card py-6 px-4 md:px-6 mt-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className='text-center md:text-left'>
                <h3 className="font-semibold text-lg">Buyer Panel</h3>
                <p className="text-sm text-muted-foreground">Manage your purchases and profile.</p>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/seller/login">
                    <Button variant="outline">Login as a Seller</Button>
                </Link>
                <Link href="/seller/signup">
                    <Button>Sign up as a Seller</Button>
                </Link>
            </div>
        </div>
      </footer>

    </div>
  );
}
