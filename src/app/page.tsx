
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Globe, ChevronRight, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import LocationPrompt from '@/components/location-prompt';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { products } from '@/lib/data';

const categories = [
  { name: 'Automotive', href: '#', image: 'https://picsum.photos/seed/car/200/150', hint: 'blue car' },
  { name: 'Property', href: '#', image: 'https://picsum.photos/seed/house/200/150', hint: 'modern house' },
  { name: 'Electronics', href: '#', image: 'https://picsum.photos/seed/laptop/200/150', hint: 'laptop electronics' },
  { name: 'Contracting', href: '#', image: 'https://picsum.photos/seed/tools/200/150', hint: 'construction tools' },
  { name: 'Services', href: '#', image: 'https://picsum.photos/seed/service/200/150', hint: 'delivery cart' },
  { name: 'Camping', href: '#', image: 'https://picsum.photos/seed/tent/200/150', hint: 'camping tent' },
  { name: 'Sports', href: '#', image: 'https://picsum.photos/seed/sports/200/150', hint: 'sports equipment' },
  { name: 'Animals', href: '#', image: 'https://picsum.photos/seed/pets/200/150', hint: 'cute pets' },
  { name: 'Family', href: '#', image: 'https://picsum.photos/seed/family/200/150', hint: 'happy family' },
  { name: 'Gifts', href: '#', image: 'https://picsum.photos/seed/gift/200/150', hint: 'gift box' },
  { name: 'Furniture', href: '#', image: 'https://picsum.photos/seed/furniture/200/150', hint: 'modern furniture' },
  { name: 'Jobs', href: '#', image: 'https://picsum.photos/seed/office/200/150', hint: 'office work' },
];

const trendingCategories = [
    { name: 'Used Cars', image: 'https://picsum.photos/seed/usedcar/100/100', hint: 'used car' },
    { name: 'Caravans', image: 'https://picsum.photos/seed/caravan/100/100', hint: 'caravan trailer' },
    { name: 'Job Openings', image: 'https://picsum.photos/seed/job/100/100', hint: 'office chair' },
    { name: 'All Science', image: 'https://picsum.photos/seed/science/100/100', hint: 'microscope' },
]

const automotiveProducts = [
    {
        name: 'Junk Cars in Kuwait City',
        description: 'نشتري نشتري جميع انواع السيارات',
        year: 2014,
        color: 'Blue',
        price: '80K KWD',
        posted: '21 Hour',
        image: 'https://picsum.photos/seed/junkcars/600/400',
        hint: 'junk cars'
    },
    {
        name: 'Car Services',
        description: 'تبديل بطاريات سلف دينمو فحص',
        price: '10 KWD',
        image: 'https://picsum.photos/seed/carservice/600/400',
        hint: 'car service'
    },
    {
        name: '6 in Zahra, Block 8',
        description: 'مازدا 6 شرط الفحص بحالة جيدة',
        year: 2023,
        mileage: '71 Km',
        color: 'Silver',
        price: '3,450 KWD',
        posted: '1 Day',
        image: 'https://picsum.photos/seed/mazda6/600/400',
        hint: 'mazda car'
    },
    {
        name: 'H2 in Hawalli',
        description: '2008 HUMMER H2 SUT وانيت',
        year: 2008,
        mileage: '130K Km',
        color: 'Black',
        price: '9,250 KWD',
        posted: '1 Day',
        image: 'https://picsum.photos/seed/hummer/600/400',
        hint: 'hummer car'
    },
    {
        name: 'Patrol',
        description: 'بي 217 الف',
        year: 2015,
        mileage: '217 K',
        price: '5,100 KWD',
        posted: '1 Day',
        image: 'https://picsum.photos/seed/patrol/600/400',
        hint: 'nissan patrol'
    }
]

const navLinks = [
  "Automotive", "Property", "Electronics", "Contracting", "Services", "Camping", "Sports", "Animals", "Family", "Gifts", "Furniture", "Jobs", "Education", "Others", "Commercial"
]

export default function Home() {
    const bannerImages = PlaceHolderImages.filter(img => img.id.startsWith('banner-'));

  return (
    <div className="w-full bg-background font-body text-foreground">
      <LocationPrompt />
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              Ecomm Now
            </Link>
          <div className="flex-1 px-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for anything"
                className="w-full pl-10 bg-muted border-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>العربية</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>English</DropdownMenuItem>
                  <DropdownMenuItem>العربية</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/login" className="text-sm font-medium hover:text-primary">
                  Log In
              </Link>
              <Link href="#" className="text-sm font-medium hover:text-primary">
                  Sign Up
              </Link>
             <Link href="/seller/dashboard/products/add">
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Ad
                </Button>
              </Link>
          </div>
        </div>
        <nav className="border-t">
          <div className="container mx-auto flex items-center justify-center px-4 h-12 overflow-x-auto">
            <div className="flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link key={link} href="#" className="text-foreground hover:text-primary whitespace-nowrap">
                  {link}
                  {link === 'Commercial' && <span className="ml-1.5 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5">New</span>}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <div className="container mx-auto p-4 md:p-6 space-y-8">
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
                <div className="aspect-[16/6] rounded-lg overflow-hidden relative w-full bg-blue-600">
                  <Image
                    src={bannerImage.imageUrl}
                    alt={bannerImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={bannerImage.imageHint}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="text-center text-white p-8">
                        <h2 className="text-5xl font-bold mb-2">Your Store, Your Way</h2>
                        <h3 className="text-6xl font-bold text-yellow-400">Ecomm Now</h3>
                     </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
        </Carousel>

        <div>
            <h2 className="text-2xl font-bold mb-4">Discover Our <span className="text-primary">Categories</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {categories.map((category) => (
                    <Link key={category.name} href={category.href} className="group flex flex-col items-center gap-2 text-center">
                        <div className="bg-muted rounded-lg p-4 aspect-square w-full flex items-center justify-center transition-colors group-hover:bg-primary/10">
                             <Image
                                src={category.image}
                                alt={category.name}
                                width={80}
                                height={80}
                                className="object-contain"
                                data-ai-hint={category.hint}
                            />
                        </div>
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary">{category.name}</span>
                    </Link>
                ))}
            </div>
        </div>

        <div className="rounded-xl bg-blue-500/10 p-6">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Trending Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {trendingCategories.map((category) => (
                    <Link key={category.name} href="#" className="group flex flex-col items-center gap-3 text-center">
                        <div className="bg-white rounded-full p-2 aspect-square w-32 h-32 flex items-center justify-center transition-transform group-hover:scale-105 shadow-md">
                             <Image
                                src={category.image}
                                alt={category.name}
                                width={120}
                                height={120}
                                className="object-cover rounded-full"
                                data-ai-hint={category.hint}
                            />
                        </div>
                        <span className="text-base font-semibold text-blue-900">{category.name}</span>
                    </Link>
                ))}
            </div>
        </div>
        
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">All in <span className="text-primary">Automotive</span></h2>
                 <Link href="#" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                 </Link>
            </div>
            <Carousel opts={{ align: "start" }} className="w-full">
                <CarouselContent className="-ml-4">
                    {automotiveProducts.map((product, index) => (
                        <CarouselItem key={index} className="pl-4 md:basis-1/3 lg:basis-1/4">
                            <Card className="overflow-hidden h-full group">
                                <CardContent className="p-0">
                                <div className="aspect-[4/3] relative w-full overflow-hidden">
                                     <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                        data-ai-hint={product.hint}
                                    />
                                    <Badge className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 font-bold gap-1 pl-1.5">
                                        <Crown className="w-3.5 h-3.5" />
                                        Featured
                                    </Badge>
                                </div>
                                <div className="p-3 space-y-2">
                                    <h3 className="font-semibold text-base leading-tight truncate text-right text-blue-900 group-hover:text-primary">{product.description}</h3>
                                    <p className="text-sm text-muted-foreground">{product.name}</p>
                                    <div className="text-xs text-muted-foreground space-x-2">
                                        {product.year && <span>{product.year}</span>}
                                        {product.mileage && <span>{product.mileage}</span>}
                                        {product.color && <span>{product.color}</span>}
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <p className="text-xs text-muted-foreground">{product.posted}</p>
                                        <p className="font-bold text-lg text-primary">{product.price}</p>
                                    </div>
                                </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                 <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10" />
                 <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10" />
            </Carousel>
        </div>

      </div>

       <Link href="/vision-search">
        <Button size="icon" className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
            <span className="sr-only">Find by image</span>
        </Button>
      </Link>
    </div>
  );
}

    