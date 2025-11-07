"use client";

import type { Seller, Coordinates } from "@/lib/types";
import { getDistance } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

type SellerListProps = {
  sellers: Seller[];
  productName: string;
  onSellerSelect: (seller: Seller | null) => void;
};

export default function SellerList({ sellers, productName, onSellerSelect }: SellerListProps) {
  const { location: buyerLocation, error: geolocationError } = useGeolocation();

  if (sellers.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8 h-full flex flex-col items-center justify-center">
        <p>No sellers found for "{productName}".</p>
        <p className="text-sm">Try a different product or image.</p>
      </div>
    );
  }

  const handleNavigate = (seller: Seller) => {
    if (buyerLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${buyerLocation.lat},${buyerLocation.lng}&destination=${seller.location.lat},${seller.location.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getProductPrice = (seller: Seller, productName: string) => {
    const product = seller.products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
    return product ? `$${product.price.toFixed(2)}` : "N/A";
  };
  
  return (
    <div className="space-y-3 pt-2">
      {geolocationError && (
        <Alert variant="destructive" className="mb-4">
          <MapPin className="h-4 w-4" />
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>
            Could not get your location to calculate distances. Please enable location services in your browser.
          </AlertDescription>
        </Alert>
      )}
      {sellers
        .map(seller => ({
            seller,
            distance: buyerLocation ? getDistance(buyerLocation.lat, buyerLocation.lng, seller.location.lat, seller.location.lng) : Infinity
        }))
        .sort((a, b) => a.distance - b.distance)
        .map(({ seller, distance }) => (
          <Card 
            key={seller.id} 
            className="hover:shadow-md transition-shadow cursor-pointer border-transparent hover:border-primary"
            onMouseEnter={() => onSellerSelect(seller)}
            onMouseLeave={() => onSellerSelect(null)}
          >
            <CardHeader className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-lg">{seller.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 pt-1 text-xs">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> 
                    <span>{seller.address}</span>
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-base font-bold whitespace-nowrap">
                    {getProductPrice(seller, productName)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex justify-between items-center text-sm">
                <div className="text-muted-foreground font-medium">
                  {distance !== Infinity ? `${distance.toFixed(1)} km away` : 'Distance unknown'}
                </div>
                <Button 
                    className="bg-accent text-accent-foreground hover:bg-accent/90" 
                    size="sm"
                    onClick={() => handleNavigate(seller)} 
                    disabled={!buyerLocation}>
                  <Navigation className="mr-2 h-4 w-4" />
                  Navigate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
