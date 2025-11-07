"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Package2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import ProductFinder from "@/components/product-finder";
import type { Seller } from "@/lib/types";
import { useGeolocation } from "@/hooks/use-geolocation";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-lg" />,
});

export default function Home() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  
  const { location: buyerLocation } = useGeolocation();

  const handleSellersFound = (foundSellers: Seller[]) => {
    setSellers(foundSellers);
  };
  
  const handleSellerSelect = (seller: Seller | null) => {
    setSelectedSeller(seller);
  };

  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">See & Seek</span>
        </div>
      </header>

      <main className="grid h-[calc(100vh-3.5rem)] md:grid-cols-2 lg:grid-cols-[480px_1fr]">
        <div className="flex flex-col overflow-y-auto border-r">
          <ProductFinder 
            onSellersFound={handleSellersFound}
            onSellerSelect={handleSellerSelect}
          />
        </div>
        <div className="hidden h-full w-full items-center justify-center bg-muted md:flex">
            {typeof window !== 'undefined' && (
              <MapView 
                sellers={sellers}
                buyerLocation={buyerLocation}
                selectedSeller={selectedSeller}
              />
            )}
        </div>
      </main>
    </div>
  );
}
